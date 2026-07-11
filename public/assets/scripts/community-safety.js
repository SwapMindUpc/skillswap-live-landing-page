const communityStore = window.SkillSwapStore;
const communityToast = document.querySelector("#app-toast");
const identityDialog = document.querySelector("#identity-dialog");
const safePlaceDialog = document.querySelector("#safe-place-dialog");
const blockedDialog = document.querySelector("#blocked-dialog");
const reportDialog = document.querySelector("#report-dialog");
const achievementDialog = document.querySelector("#achievement-dialog");
const feedbackDialog = document.querySelector("#feedback-dialog");
const communityMentorDialog = document.querySelector("#mentor-dialog");
let communityUser;
let communityToastTimer;

const mentorIdsByName = {
    "José Paredes": "2",
    "Grecia Ascarza": "3",
    "Jhoel Armas": "4",
    "Lucía Velarde": "5",
    "Mariana Torres": "6",
    "Jeferson Contreras": "7",
};

const showCommunityToast = (message, isError = false) => {
    window.clearTimeout(communityToastTimer);
    communityToast.querySelector("span").textContent = message;
    communityToast.hidden = false;
    communityToast.classList.toggle("is-error", isError);
    communityToast.classList.add("is-visible");
    communityToastTimer = window.setTimeout(() => {
        communityToast.hidden = true;
        communityToast.classList.remove("is-visible", "is-error");
    }, 2800);
};

const refreshCommunityIcons = () => window.lucide?.createIcons();

const getCommunityUser = async () => {
    if (communityUser) return communityUser;
    communityUser = await communityStore.getCurrentUser();

    if (!communityUser) {
        communityStore.setCurrentUser("1");
        communityUser = await communityStore.get("users", "1");
    }

    return communityUser;
};

const setCommunityMessage = (element, message, isError = true) => {
    element.textContent = message;
    element.classList.toggle("is-success", !isError);
    element.hidden = !message;
};

const mentorIdForCard = (card) => card?.dataset.mentorId
    || mentorIdsByName[card?.dataset.name || card?.querySelector("h3")?.textContent.trim()];

const loadFavorites = async () => {
    const user = await getCommunityUser();
    const favorites = await communityStore.list("favorites", { userId: user.id });
    const favoriteIds = new Set(favorites.map((favorite) => String(favorite.mentorId)));

    document.querySelectorAll(".favorite-button").forEach((button) => {
        const mentorId = mentorIdForCard(button.closest(".mentor-card"));
        const isFavorite = favoriteIds.has(String(mentorId));
        button.classList.toggle("is-favorite", isFavorite);
        button.setAttribute("aria-pressed", String(isFavorite));
        button.setAttribute("aria-label", isFavorite ? "Quitar de favoritos" : "Agregar a favoritos");
    });
};

document.querySelectorAll(".favorite-button").forEach((button) => {
    button.addEventListener("click", async () => {
        const user = await getCommunityUser();
        const mentorId = mentorIdForCard(button.closest(".mentor-card"));
        if (!mentorId) return;

        const existing = await communityStore.list("favorites", { userId: user.id, mentorId });

        try {
            if (existing.length) {
                await communityStore.remove("favorites", existing[0].id);
                button.classList.remove("is-favorite");
                button.setAttribute("aria-pressed", "false");
                button.setAttribute("aria-label", "Agregar a favoritos");
                showCommunityToast("Mentor eliminado de favoritos");
            } else {
                await communityStore.create("favorites", { userId: user.id, mentorId: String(mentorId) });
                button.classList.add("is-favorite");
                button.setAttribute("aria-pressed", "true");
                button.setAttribute("aria-label", "Quitar de favoritos");
                showCommunityToast("Mentor guardado en favoritos");
            }
        } catch (error) {
            showCommunityToast(error.message || "No se pudo actualizar favoritos", true);
        }
    });
});

const renderMentorProfileData = async (mentorId) => {
    const mentor = await communityStore.get("users", mentorId);
    const reviews = await communityStore.list("reviews", { targetUserId: String(mentorId) });
    if (!mentor) return;

    const stats = document.querySelectorAll(".dialog-stats span strong");
    if (stats[0]) stats[0].textContent = mentor.rating || "Nuevo";
    if (stats[1]) stats[1].textContent = mentor.sessions || 0;
    if (stats[2]) stats[2].textContent = mentor.sessions ? "98%" : "Sin datos";

    const reviewList = document.querySelector("#mentor-review-list");
    reviewList.innerHTML = reviews.length
        ? reviews.slice(-2).reverse().map((review) => `<article><span>${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span><p>“${review.text}”</p></article>`).join("")
        : "<p class='empty-review'>Este mentor todavía no tiene reseñas.</p>";

    const timeOptions = document.querySelector(".time-options");
    const slots = mentor.availableSlots || [];
    timeOptions.innerHTML = slots.length
        ? slots.map((slot, index) => `<button class="${index === 0 ? "is-selected" : ""}" type="button">${slot}</button>`).join("")
        : '<span class="no-availability">No hay horarios disponibles.</span>';

    timeOptions.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
            timeOptions.querySelectorAll("button").forEach((item) => item.classList.toggle("is-selected", item === button));
        });
    });
};

document.querySelectorAll(".mentor-details-button").forEach((button) => {
    button.addEventListener("click", () => {
        const mentorId = mentorIdForCard(button.closest(".mentor-card"));
        if (mentorId) renderMentorProfileData(mentorId);
    });
});

const renderRecommendationReason = async () => {
    const user = await getCommunityUser();
    const heading = document.querySelector(".recommendation-section .panel-heading h2");
    if (!heading) return;

    heading.textContent = user.skillsLearn?.length
        ? `Mentores para ${user.skillsLearn.slice(0, 3).join(", ")}`
        : "Mentores populares para empezar";
};

const renderNearbyUsers = async () => {
    const user = await getCommunityUser();
    const users = await communityStore.list("users");
    const blockedIds = new Set((user.blockedUserIds || []).map(String));
    const nearby = users
        .filter((candidate) => candidate.id !== user.id && candidate.distanceKm != null && candidate.distanceKm <= 3 && !blockedIds.has(String(candidate.id)))
        .sort((first, second) => first.distanceKm - second.distanceKm)
        .slice(0, 4);
    const container = document.querySelector("#nearby-users");
    if (!container) return;

    container.innerHTML = nearby.length
        ? nearby.map((candidate) => `<article><span class="avatar avatar-teal small">${candidate.photo}</span><div><strong>${candidate.name}</strong><small>${candidate.skillsTeach.slice(0, 2).join(" · ")} · ${candidate.distanceKm} km</small></div><button class="icon-button compact" type="button" data-nearby-mentor="${candidate.id}" aria-label="Ver a ${candidate.name}"><i data-lucide="chevron-right" aria-hidden="true"></i></button></article>`).join("")
        : '<p class="empty-community-state">No hay personas cercanas disponibles.</p>';
    refreshCommunityIcons();
};

const renderPopularSkills = async () => {
    const skills = await communityStore.list("popularSkills");
    const list = document.querySelector(".trending-list");
    if (!list) return;

    list.innerHTML = skills.length
        ? skills.sort((first, second) => second.searches - first.searches).map((skill, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${skill.name}</strong><small>${skill.searches} búsquedas</small></div><i data-lucide="${skill.trend === "up" ? "trending-up" : "minus"}" aria-hidden="true"></i></li>`).join("")
        : '<li class="empty-community-state">Aún no hay tendencias disponibles.</li>';
    refreshCommunityIcons();
};

const prependAchievement = (achievement, user) => {
    const feed = document.querySelector(".community-feed");
    const article = document.createElement("article");
    article.className = "feed-card";
    article.dataset.achievementId = achievement.id;
    article.innerHTML = `<div class="feed-author"><span class="avatar avatar-coral">${user.photo?.startsWith("data:") ? "US" : user.photo}</span><span><strong>${user.name}</strong><small>Ahora · ${user.district}</small></span><button class="icon-button compact" type="button" aria-label="Más opciones"><i data-lucide="ellipsis" aria-hidden="true"></i></button></div><div class="achievement-banner teal-banner"><span><i data-lucide="badge-check" aria-hidden="true"></i> Logro compartido</span><strong>${achievement.title}</strong><p>${achievement.message}</p></div><div class="feed-actions"><button type="button" class="reaction-button" aria-pressed="false"><i data-lucide="heart" aria-hidden="true"></i><span>${achievement.likes}</span></button><button type="button"><i data-lucide="message-circle" aria-hidden="true"></i> 0 comentarios</button><button type="button" class="share-button"><i data-lucide="share-2" aria-hidden="true"></i> Compartir</button></div>`;
    feed.prepend(article);
    refreshCommunityIcons();
};

document.querySelector("#share-achievement")?.addEventListener("click", () => {
    document.querySelector("#achievement-form").reset();
    document.querySelector("#achievement-message-error").hidden = true;
    achievementDialog.showModal();
});

document.querySelector("#achievement-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const user = await getCommunityUser();
    const title = document.querySelector("#achievement-title").value.trim();
    const message = document.querySelector("#achievement-message").value.trim();
    const error = document.querySelector("#achievement-message-error");
    if (!title || !message) {
        setCommunityMessage(error, "Completa el título y el mensaje del logro.");
        return;
    }

    const achievement = await communityStore.create("achievements", {
        userId: user.id,
        title,
        message,
        likes: 0,
        createdAt: new Date().toISOString(),
    });
    prependAchievement(achievement, user);
    achievementDialog.close();
    showCommunityToast("Logro publicado en la comunidad");
});

document.querySelector(".community-feed")?.addEventListener("click", async (event) => {
    const reaction = event.target.closest(".reaction-button");
    const share = event.target.closest(".share-button");
    const card = event.target.closest("[data-achievement-id]");
    if (!card) return;

    if (reaction) {
        const achievement = await communityStore.get("achievements", card.dataset.achievementId);
        if (!achievement) return;
        const isActive = reaction.classList.toggle("is-active");
        const likes = Math.max(0, achievement.likes + (isActive ? 1 : -1));
        await communityStore.update("achievements", achievement.id, { likes });
        reaction.setAttribute("aria-pressed", String(isActive));
        reaction.querySelector("span").textContent = likes;
    }

    if (share) {
        const link = `https://skillswap.live/logros/${card.dataset.achievementId}`;
        try {
            await navigator.clipboard.writeText(link);
            showCommunityToast("Enlace del logro copiado");
        } catch {
            showCommunityToast(link);
        }
    }
});

document.querySelector("#copy-invite")?.addEventListener("click", async () => {
    const user = await getCommunityUser();
    const code = `INV-${user.id}-${Date.now().toString(36).toUpperCase()}`;
    const link = `https://skillswap.live/invita/${code}`;
    await communityStore.create("invitations", {
        userId: user.id,
        code,
        status: "created",
        createdAt: new Date().toISOString(),
    });

    try {
        await navigator.clipboard.writeText(link);
        showCommunityToast("Invitación creada y copiada");
    } catch {
        showCommunityToast(`Invitación creada: ${link}`);
    }
});

const openReportDialog = (targetUserId = "") => {
    document.querySelector("#report-form").reset();
    document.querySelector("#report-target-user").value = targetUserId;
    document.querySelector("#report-dialog-title").textContent = targetUserId ? "Reportar comportamiento" : "Reportar incidente";
    document.querySelector("#report-message").hidden = true;
    communityMentorDialog?.close();
    reportDialog.showModal();
};

document.querySelector("#report-mentor")?.addEventListener("click", () => openReportDialog(communityMentorDialog.dataset.mentorId));

document.querySelector("#report-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const user = await getCommunityUser();
    const type = document.querySelector("#report-type").value;
    const description = document.querySelector("#report-description").value.trim();
    const message = document.querySelector("#report-message");
    if (!type || !description) {
        setCommunityMessage(message, "Selecciona un tipo y describe lo ocurrido.");
        return;
    }

    await communityStore.create("reports", {
        reporterId: user.id,
        targetUserId: document.querySelector("#report-target-user").value || null,
        type,
        description,
        status: "open",
        createdAt: new Date().toISOString(),
    });
    reportDialog.close();
    showCommunityToast("Reporte registrado. El equipo revisará el caso");
});

document.querySelector("#block-mentor")?.addEventListener("click", async () => {
    const user = await getCommunityUser();
    const mentorId = communityMentorDialog.dataset.mentorId;
    if (!mentorId) return;

    const blockedUserIds = [...new Set([...(user.blockedUserIds || []).map(String), String(mentorId)])];
    communityUser = await communityStore.update("users", user.id, { blockedUserIds });
    communityMentorDialog.close();
    await renderNearbyUsers();
    showCommunityToast("Usuario bloqueado correctamente");
});

const renderBlockedUsers = async () => {
    const user = await getCommunityUser();
    const users = await Promise.all((user.blockedUserIds || []).map((id) => communityStore.get("users", id)));
    const container = document.querySelector("#blocked-user-list");
    container.innerHTML = users.filter(Boolean).length
        ? users.filter(Boolean).map((blocked) => `<article><span class="avatar avatar-coral small">${blocked.photo}</span><div><strong>${blocked.name}</strong><small>${blocked.district}</small></div><button class="button button-secondary" type="button" data-unblock-user="${blocked.id}">Desbloquear</button></article>`).join("")
        : '<p class="empty-community-state">No tienes usuarios bloqueados.</p>';
};

document.querySelector("#blocked-user-list")?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-unblock-user]");
    if (!button) return;
    const user = await getCommunityUser();
    communityUser = await communityStore.update("users", user.id, {
        blockedUserIds: (user.blockedUserIds || []).filter((id) => String(id) !== button.dataset.unblockUser),
    });
    await renderBlockedUsers();
    await renderNearbyUsers();
    showCommunityToast("Usuario desbloqueado");
});

const renderSafePlaces = async () => {
    const user = await getCommunityUser();
    const places = await communityStore.list("safePlaces");
    const container = document.querySelector("#safe-place-list");
    container.innerHTML = places.length
        ? places.map((place) => `<button class="safe-place-option ${String(user.selectedSafePlaceId) === String(place.id) ? "is-selected" : ""}" type="button" data-safe-place="${place.id}"><span><i data-lucide="building-2" aria-hidden="true"></i></span><div><strong>${place.name}</strong><small>${place.address} · ${place.openHours}</small></div><i data-lucide="${String(user.selectedSafePlaceId) === String(place.id) ? "circle-check-big" : "chevron-right"}" aria-hidden="true"></i></button>`).join("")
        : '<p class="empty-community-state">No hay lugares seguros disponibles.</p>';
    refreshCommunityIcons();
};

document.querySelector("#safe-place-list")?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-safe-place]");
    if (!button) return;
    const user = await getCommunityUser();
    communityUser = await communityStore.update("users", user.id, { selectedSafePlaceId: button.dataset.safePlace });
    await renderSafePlaces();
    showCommunityToast("Lugar seguro seleccionado");
});

document.querySelector("#verify-identity")?.addEventListener("click", () => {
    document.querySelector("#identity-form").reset();
    document.querySelector("#identity-message").hidden = true;
    identityDialog.showModal();
});

document.querySelector("#identity-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = document.querySelector("#identity-document").files[0];
    const consent = document.querySelector("#identity-consent").checked;
    const message = document.querySelector("#identity-message");
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];

    if (!file || !consent) {
        setCommunityMessage(message, "Selecciona un documento y confirma la autorización.");
        return;
    }
    if (!validTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
        setCommunityMessage(message, "El documento debe ser JPG, PNG o PDF y pesar menos de 5 MB.");
        return;
    }

    const user = await getCommunityUser();
    await communityStore.create("identityRequests", {
        userId: user.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        status: "pending",
        createdAt: new Date().toISOString(),
    });
    communityUser = await communityStore.update("users", user.id, { identityStatus: "pending" });
    identityDialog.close();
    showCommunityToast("Documento válido. Verificación pendiente");
});

document.querySelectorAll("[data-safety-action]").forEach((button) => {
    button.addEventListener("click", async () => {
        if (button.dataset.safetyAction === "places") {
            await renderSafePlaces();
            safePlaceDialog.showModal();
        }
        if (button.dataset.safetyAction === "blocked") {
            await renderBlockedUsers();
            blockedDialog.showModal();
        }
        if (button.dataset.safetyAction === "report") openReportDialog();
    });
});

document.querySelectorAll("[data-feedback-kind]").forEach((button) => {
    button.addEventListener("click", () => {
        const kind = button.dataset.feedbackKind;
        document.querySelector("#feedback-form").reset();
        document.querySelector("#feedback-kind").value = kind;
        document.querySelector("#feedback-dialog-title").textContent = kind === "feedback" ? "Dar feedback" : "Enviar sugerencia";
        document.querySelector("#feedback-message").hidden = true;
        feedbackDialog.showModal();
    });
});

document.querySelector("#feedback-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = document.querySelector("#feedback-text").value.trim();
    const message = document.querySelector("#feedback-message");
    if (!text) {
        setCommunityMessage(message, "Escribe un mensaje antes de enviar.");
        return;
    }

    const user = await getCommunityUser();
    const kind = document.querySelector("#feedback-kind").value;
    await communityStore.create("feedback", {
        userId: user.id,
        kind,
        message: text,
        status: "new",
        createdAt: new Date().toISOString(),
    });
    feedbackDialog.close();
    showCommunityToast(kind === "feedback" ? "Feedback registrado" : "Sugerencia registrada");
});

document.querySelectorAll("[data-community-close]").forEach((button) => {
    button.addEventListener("click", () => document.querySelector(`#${button.dataset.communityClose}`)?.close());
});

Promise.all([
    getCommunityUser(),
    loadFavorites(),
    renderRecommendationReason(),
    renderNearbyUsers(),
    renderPopularSkills(),
]).catch((error) => showCommunityToast(error.message || "No se pudo cargar la comunidad", true));
