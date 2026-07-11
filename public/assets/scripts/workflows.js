const workflowStore = window.SkillSwapStore;
const workflowToast = document.querySelector("#app-toast");
const workflowMentorDialog = document.querySelector("#mentor-dialog");
const chatDialog = document.querySelector("#chat-dialog");
const reviewDialog = document.querySelector("#review-dialog");
const sessionRoomDialog = document.querySelector("#session-room-dialog");
let workflowCurrentUser;
let workflowToastTimer;
let roomTimerInterval;
let roomStartedAt;

const showWorkflowToast = (message, isError = false) => {
    window.clearTimeout(workflowToastTimer);
    workflowToast.querySelector("span").textContent = message;
    workflowToast.hidden = false;
    workflowToast.classList.toggle("is-error", isError);
    workflowToast.classList.add("is-visible");

    workflowToastTimer = window.setTimeout(() => {
        workflowToast.hidden = true;
        workflowToast.classList.remove("is-visible", "is-error");
    }, 2800);
};

const refreshWorkflowIcons = () => window.lucide?.createIcons();

const startRoomTimer = () => {
    window.clearInterval(roomTimerInterval);
    roomStartedAt = Date.now();

    const updateTimer = () => {
        const elapsedSeconds = Math.floor((Date.now() - roomStartedAt) / 1000);
        const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
        const seconds = String(elapsedSeconds % 60).padStart(2, "0");
        const timer = document.querySelector("#room-timer");
        if (timer) timer.textContent = `${minutes}:${seconds}`;
    };

    updateTimer();
    roomTimerInterval = window.setInterval(updateTimer, 1000);
};

const getWorkflowUser = async () => {
    if (workflowCurrentUser) return workflowCurrentUser;
    workflowCurrentUser = await workflowStore.getCurrentUser();

    if (!workflowCurrentUser) {
        workflowStore.setCurrentUser("1");
        workflowCurrentUser = await workflowStore.get("users", "1");
    }

    return workflowCurrentUser;
};

const notifyAccountChanged = () => {
    window.dispatchEvent(new CustomEvent("skillswap:account-updated"));
};

const createNotification = (userId, type, title, message) => workflowStore.create("notifications", {
    userId: String(userId),
    type,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
});

const renderNotifications = async () => {
    const user = await getWorkflowUser();
    const notifications = await workflowStore.list("notifications", { userId: user.id });
    const panel = document.querySelector("#notification-panel");
    if (!panel) return;

    panel.querySelectorAll(".notification-item").forEach((item) => item.remove());

    const iconByType = {
        mentorship: "calendar-check-2",
        credits: "coins",
        review: "star",
        reminder: "bell-ring",
        message: "message-circle",
    };

    notifications
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
        .slice(0, 6)
        .forEach((notification) => {
            const button = document.createElement("button");
            button.className = "notification-item";
            button.type = "button";
            button.innerHTML = `
                <span class="notification-icon ${notification.read ? "blue" : "success"}">
                    <i data-lucide="${iconByType[notification.type] || "bell"}" aria-hidden="true"></i>
                </span>
                <span><strong>${notification.title}</strong><small>${notification.message}</small></span>
            `;
            button.addEventListener("click", async () => {
                await workflowStore.update("notifications", notification.id, { read: true });
                button.querySelector(".notification-icon")?.classList.replace("success", "blue");
            });
            panel.append(button);
        });

    const hasUnread = notifications.some((notification) => !notification.read);
    const indicator = document.querySelector(".notification-button > span");
    if (indicator) indicator.hidden = !hasUnread;
    refreshWorkflowIcons();
};

const renderTransactions = async () => {
    const user = await getWorkflowUser();
    const transactions = await workflowStore.list("transactions", { userId: user.id });
    const container = document.querySelector(".transaction-list");
    if (!container) return;

    const iconByType = {
        earned: "arrow-down-left",
        spent: "arrow-up-right",
        bonus: "gift",
    };

    container.innerHTML = transactions
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
        .map((transaction) => `
            <article data-transaction="${transaction.type === "bonus" ? "earned" : transaction.type}">
                <span class="transaction-icon ${transaction.type}"><i data-lucide="${iconByType[transaction.type]}" aria-hidden="true"></i></span>
                <div><strong>${transaction.description}</strong><small>${new Date(transaction.createdAt).toLocaleDateString("es-PE")} · ${transaction.relatedUser}</small></div>
                <span class="transaction-amount ${transaction.amount > 0 ? "positive" : "negative"}">${transaction.amount > 0 ? "+" : ""}${transaction.amount}</span>
            </article>
        `).join("");
    refreshWorkflowIcons();
};

const requestMentorship = async () => {
    const user = await getWorkflowUser();
    const mentorId = workflowMentorDialog.dataset.mentorId;
    const mentor = await workflowStore.get("users", mentorId);
    const selectedTime = document.querySelector(".time-options button.is-selected")?.textContent.trim();
    const question = document.querySelector("#prior-question").value.trim();
    const credits = mentor?.sessionCredits || 30;

    if (!selectedTime) {
        showWorkflowToast("Selecciona un horario disponible", true);
        return;
    }

    if (user.credits < credits) {
        showWorkflowToast(`Necesitas ${credits} créditos y tienes ${user.credits}`, true);
        return;
    }

    try {
        await workflowStore.create("mentorships", {
            mentorId,
            learnerId: user.id,
            skill: document.querySelector("#dialog-skill").textContent.trim(),
            date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            time: selectedTime.split("·").pop().trim(),
            slotLabel: selectedTime,
            modality: mentor.modalities?.[0] || "virtual",
            status: "pending",
            attendanceConfirmed: false,
            priorQuestion: question,
            credits,
            reminderSent: false,
            createdAt: new Date().toISOString(),
        });

        workflowCurrentUser = await workflowStore.update("users", user.id, {
            credits: user.credits - credits,
        });
        await workflowStore.create("transactions", {
            userId: user.id,
            type: "spent",
            amount: -credits,
            description: `Solicitud de ${document.querySelector("#dialog-skill").textContent.trim()}`,
            relatedUser: mentor.name,
            createdAt: new Date().toISOString(),
        });
        await createNotification(mentorId, "mentorship", "Nueva solicitud", `${user.name} solicitó una mentoría contigo.`);

        workflowMentorDialog.close();
        document.querySelector("#prior-question").value = "";
        notifyAccountChanged();
        await renderTransactions();
        showWorkflowToast("Solicitud enviada y créditos reservados");
    } catch (error) {
        showWorkflowToast(error.message || "No se pudo enviar la solicitud", true);
    }
};

document.querySelector("#request-mentorship")?.addEventListener("click", requestMentorship);

const getSessionContext = async (button) => {
    const card = button.closest("[data-mentorship-id]");
    const mentorshipId = card?.dataset.mentorshipId;
    return {
        card,
        mentorshipId,
        mentorship: mentorshipId ? await workflowStore.get("mentorships", mentorshipId) : null,
    };
};

const renderChat = async (mentorshipId) => {
    const messages = await workflowStore.list("messages", { mentorshipId: String(mentorshipId) });
    const users = await workflowStore.list("users");
    const usersById = new Map(users.map((user) => [String(user.id), user]));
    const user = await getWorkflowUser();
    const container = document.querySelector("#chat-messages");

    container.innerHTML = messages.length
        ? messages
            .sort((first, second) => new Date(first.sentAt) - new Date(second.sentAt))
            .map((message) => {
                const author = usersById.get(String(message.senderId));
                const isOwn = String(message.senderId) === String(user.id);
                return `<article class="chat-message ${isOwn ? "is-own" : ""}"><span class="avatar ${isOwn ? "avatar-coral" : "avatar-blue"} small">${author?.photo || "US"}</span><div><strong>${isOwn ? "Tú" : author?.name || "Usuario"}</strong><p>${message.text}</p><small>${new Date(message.sentAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</small></div></article>`;
            }).join("")
        : '<div class="chat-empty"><i data-lucide="message-circle" aria-hidden="true"></i><p>Aún no hay mensajes. Empieza la coordinación.</p></div>';
    container.scrollTop = container.scrollHeight;
    refreshWorkflowIcons();
};

const openChat = async (mentorship) => {
    document.querySelector("#chat-mentorship-id").value = mentorship.id;
    document.querySelector("#chat-session-title").textContent = mentorship.skill;
    await renderChat(mentorship.id);
    chatDialog.showModal();
};

document.querySelector("#chat-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.querySelector("#chat-message");
    const text = input.value.trim();
    const mentorshipId = document.querySelector("#chat-mentorship-id").value;
    if (!text) return;

    const user = await getWorkflowUser();
    const mentorship = await workflowStore.get("mentorships", mentorshipId);
    const recipientId = String(mentorship.mentorId) === String(user.id) ? mentorship.learnerId : mentorship.mentorId;

    try {
        await workflowStore.create("messages", {
            mentorshipId,
            senderId: user.id,
            text,
            sentAt: new Date().toISOString(),
        });
        await createNotification(recipientId, "message", "Nuevo mensaje", `${user.name}: ${text.slice(0, 80)}`);
        input.value = "";
        await renderChat(mentorshipId);
    } catch (error) {
        showWorkflowToast(error.message || "No se pudo enviar el mensaje", true);
    }
});

const updateSessionStatus = async (context, status, successMessage, notificationMessage) => {
    const user = await getWorkflowUser();
    const otherUserId = String(context.mentorship.mentorId) === String(user.id)
        ? context.mentorship.learnerId
        : context.mentorship.mentorId;

    await workflowStore.update("mentorships", context.mentorshipId, { status });
    await createNotification(otherUserId, "mentorship", successMessage, notificationMessage);
    showWorkflowToast(successMessage);
};

const completeSession = async (context) => {
    const mentorship = context.mentorship;
    const mentor = await workflowStore.get("users", mentorship.mentorId);
    const confirmations = [...new Set([mentorship.mentorId, mentorship.learnerId])];

    await workflowStore.update("mentorships", mentorship.id, {
        status: "completed",
        completionConfirmedBy: confirmations,
        completedAt: new Date().toISOString(),
    });
    await workflowStore.update("users", mentor.id, {
        credits: mentor.credits + mentorship.credits,
        sessions: (mentor.sessions || 0) + 1,
    });
    await workflowStore.create("transactions", {
        userId: mentor.id,
        type: "earned",
        amount: mentorship.credits,
        description: `Mentoría de ${mentorship.skill} completada`,
        relatedUser: "SkillSwap Live",
        createdAt: new Date().toISOString(),
    });
    await createNotification(mentor.id, "credits", "Créditos recibidos", `Ganaste ${mentorship.credits} créditos por completar la mentoría.`);
    context.card.dataset.sessionStatus = "completed";
    showWorkflowToast("Mentoría completada y créditos asignados");
};

const repeatSession = async (context) => {
    const user = await getWorkflowUser();
    if (user.credits < context.mentorship.credits) {
        showWorkflowToast("No tienes créditos suficientes para repetir esta mentoría", true);
        return;
    }

    await workflowStore.create("mentorships", {
        ...context.mentorship,
        id: undefined,
        status: "pending",
        date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        attendanceConfirmed: false,
        completionConfirmedBy: [],
        createdAt: new Date().toISOString(),
    });
    workflowCurrentUser = await workflowStore.update("users", user.id, {
        credits: user.credits - context.mentorship.credits,
    });
    await workflowStore.create("transactions", {
        userId: user.id,
        type: "spent",
        amount: -context.mentorship.credits,
        description: `Repetición de ${context.mentorship.skill}`,
        relatedUser: "Mentor anterior",
        createdAt: new Date().toISOString(),
    });
    notifyAccountChanged();
    showWorkflowToast("Nueva solicitud creada con el mismo mentor");
};

document.querySelectorAll("[data-session-action]").forEach((button) => {
    button.addEventListener("click", async () => {
        const action = button.dataset.sessionAction;
        const context = await getSessionContext(button);

        if (!context.mentorship && action !== "details") {
            showWorkflowToast("No se encontró la mentoría", true);
            return;
        }

        try {
            if (action === "message") await openChat(context.mentorship);
            if (action === "join") {
                await workflowStore.update("mentorships", context.mentorshipId, { status: "in_progress", startedAt: new Date().toISOString() });
                sessionRoomDialog.showModal();
                startRoomTimer();
            }
            if (action === "attendance") {
                await workflowStore.update("mentorships", context.mentorshipId, { attendanceConfirmed: true });
                await createNotification(context.mentorship.mentorId, "mentorship", "Asistencia confirmada", "La asistencia a la mentoría fue confirmada.");
                showWorkflowToast("Asistencia confirmada");
            }
            if (action === "accept") await updateSessionStatus(context, "confirmed", "Mentoría aceptada", "Tu solicitud fue aceptada.");
            if (action === "reject") await updateSessionStatus(context, "rejected", "Solicitud rechazada", "El mentor no está disponible para esta solicitud.");
            if (action === "cancel") await updateSessionStatus(context, "cancelled", "Mentoría cancelada", "La mentoría programada fue cancelada.");
            if (action === "complete") await completeSession(context);
            if (action === "repeat") await repeatSession(context);
            if (action === "review") {
                document.querySelector("#review-mentorship-id").value = context.mentorshipId;
                document.querySelector("#review-message").hidden = true;
                reviewDialog.showModal();
            }
            await renderNotifications();
        } catch (error) {
            showWorkflowToast(error.message || "No se pudo completar la acción", true);
        }
    });
});

document.querySelector("#review-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const mentorshipId = document.querySelector("#review-mentorship-id").value;
    const mentorship = await workflowStore.get("mentorships", mentorshipId);
    const user = await getWorkflowUser();
    const rating = Number(new FormData(event.currentTarget).get("rating"));
    const text = document.querySelector("#review-text").value.trim();
    const message = document.querySelector("#review-message");

    if (!rating || !text) {
        message.textContent = "Selecciona una calificación y escribe una reseña.";
        message.hidden = false;
        return;
    }

    const targetUserId = String(mentorship.mentorId) === String(user.id) ? mentorship.learnerId : mentorship.mentorId;
    const targetUser = await workflowStore.get("users", targetUserId);
    const nextReviewCount = (targetUser.reviewCount || 0) + 1;
    const nextRating = (((targetUser.rating || 0) * (targetUser.reviewCount || 0)) + rating) / nextReviewCount;

    await workflowStore.create("reviews", {
        mentorshipId,
        authorId: user.id,
        targetUserId,
        rating,
        text,
        createdAt: new Date().toISOString(),
    });
    await workflowStore.update("users", targetUserId, {
        rating: Number(nextRating.toFixed(1)),
        reviewCount: nextReviewCount,
    });
    await createNotification(targetUserId, "review", "Nueva reseña", `${user.name} calificó tu mentoría con ${rating} estrellas.`);
    event.currentTarget.reset();
    reviewDialog.close();
    showWorkflowToast("Calificación y reseña publicadas");
});

document.querySelectorAll("[data-workflow-close]").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelector(`#${button.dataset.workflowClose}`)?.close();

        if (button.dataset.workflowClose === "session-room-dialog") {
            window.clearInterval(roomTimerInterval);
        }
    });
});

document.querySelectorAll("[data-room-control]").forEach((button) => {
    button.addEventListener("click", () => {
        const isOff = button.classList.toggle("is-off");
        const isMicrophone = button.dataset.roomControl === "mic";
        button.setAttribute("aria-pressed", String(isOff));
        button.setAttribute("title", isOff
            ? `Activar ${isMicrophone ? "micrófono" : "cámara"}`
            : `Apagar ${isMicrophone ? "micrófono" : "cámara"}`);
        button.innerHTML = `<i data-lucide="${isMicrophone ? (isOff ? "mic-off" : "mic") : (isOff ? "video-off" : "video")}" aria-hidden="true"></i><span>${isMicrophone ? "Micrófono" : "Cámara"}</span>`;
        refreshWorkflowIcons();
    });
});

const ensureReminders = async () => {
    const user = await getWorkflowUser();
    const mentorships = await workflowStore.list("mentorships");
    const upcoming = mentorships.filter((mentorship) => (
        [mentorship.mentorId, mentorship.learnerId].map(String).includes(String(user.id))
        && mentorship.status === "confirmed"
        && !mentorship.reminderSent
    ));

    for (const mentorship of upcoming) {
        await createNotification(user.id, "reminder", "Recordatorio de mentoría", `${mentorship.skill} está programada para ${mentorship.date} a las ${mentorship.time}.`);
        await workflowStore.update("mentorships", mentorship.id, { reminderSent: true });
    }
};

Promise.all([getWorkflowUser(), ensureReminders()])
    .then(() => Promise.all([renderNotifications(), renderTransactions()]))
    .catch((error) => showWorkflowToast(error.message || "No se pudieron cargar los flujos", true));
