const accountStore = window.SkillSwapStore;
const profileDialog = document.querySelector("#profile-dialog");
const skillDialog = document.querySelector("#skill-dialog");
const profileForm = document.querySelector("#profile-form");
const skillForm = document.querySelector("#skill-form");
const accountToast = document.querySelector("#app-toast");
let currentAccountUser;
let pendingPhoto;
let accountToastTimer;

const showAccountToast = (message, isError = false) => {
    if (!accountToast) return;

    window.clearTimeout(accountToastTimer);
    accountToast.querySelector("span").textContent = message;
    accountToast.hidden = false;
    accountToast.classList.toggle("is-error", isError);
    accountToast.classList.add("is-visible");

    accountToastTimer = window.setTimeout(() => {
        accountToast.hidden = true;
        accountToast.classList.remove("is-visible", "is-error");
    }, 2600);
};

const refreshAccountIcons = () => window.lucide?.createIcons();

const setDialogMessage = (element, message, isError = true) => {
    element.textContent = message;
    element.classList.toggle("is-success", !isError);
    element.hidden = !message;
};

const initialsFor = (name) => name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const applyAvatar = (element, user) => {
    if (!element) return;

    if (user.photo?.startsWith("data:image/")) {
        element.textContent = "";
        element.style.backgroundImage = `url("${user.photo}")`;
        element.style.backgroundPosition = "center";
        element.style.backgroundSize = "cover";
    } else {
        element.style.removeProperty("background-image");
        element.textContent = user.photo || initialsFor(user.name);
    }
};

const renderTags = (container, values, kind) => {
    container.innerHTML = values.map((value) => (
        `<span>${value}<button type="button" data-remove-profile-tag="${kind}" data-tag-value="${value}" aria-label="Quitar ${value}">×</button></span>`
    )).join("");
};

const renderCurrentUser = () => {
    if (!currentAccountUser) return;

    document.querySelectorAll("[data-current-avatar]").forEach((avatar) => applyAvatar(avatar, currentAccountUser));
    applyAvatar(document.querySelector("#profile-photo-preview"), currentAccountUser);

    const profileMenuName = document.querySelector(".profile-menu strong");
    const profileMenuCredits = document.querySelector(".profile-menu small");
    const profileName = document.querySelector(".profile-identity h2");
    const profileDescription = document.querySelector(".profile-identity > div > p");
    const balanceMetric = document.querySelector(".metric-card:first-child strong");
    const balancePanel = document.querySelector(".balance-panel > strong");

    if (profileMenuName) profileMenuName.textContent = currentAccountUser.name;
    if (profileMenuCredits) profileMenuCredits.textContent = `${currentAccountUser.credits} créditos`;
    if (profileName) profileName.textContent = currentAccountUser.name;
    if (profileDescription) profileDescription.textContent = `${currentAccountUser.bio || "Miembro de la comunidad"} · ${currentAccountUser.district}`;
    if (balanceMetric) balanceMetric.textContent = `${currentAccountUser.credits} créditos`;
    if (balancePanel) balancePanel.textContent = currentAccountUser.credits;

    renderTags(document.querySelector(".editable-tags:not(.interests)"), currentAccountUser.skillsTeach || [], "teach");
    renderTags(document.querySelector(".editable-tags.interests"), currentAccountUser.skillsLearn || [], "learn");

    const availability = new Map((currentAccountUser.availability || []).map((item) => [item.day, item]));
    document.querySelectorAll(".availability-grid label").forEach((label) => {
        const day = label.querySelector("span")?.textContent.trim();
        const input = label.querySelector("input");
        const range = label.querySelector("small");
        const saved = availability.get(day);

        input.checked = saved?.enabled ?? false;
        range.textContent = saved?.range || "No disponible";
    });

    refreshAccountIcons();
};

const loadCurrentUser = async () => {
    await accountStore.init();
    currentAccountUser = await accountStore.getCurrentUser();

    if (!currentAccountUser) {
        accountStore.setCurrentUser("1");
        currentAccountUser = await accountStore.get("users", "1");
    }

    renderCurrentUser();
};

document.querySelector("#edit-profile")?.addEventListener("click", () => {
    profileForm.elements.name.value = currentAccountUser.name;
    profileForm.elements.email.value = currentAccountUser.email;
    profileForm.elements.district.value = currentAccountUser.district;
    profileForm.elements.bio.value = currentAccountUser.bio || "";
    pendingPhoto = undefined;
    setDialogMessage(document.querySelector("#profile-form-message"), "");
    applyAvatar(document.querySelector("#profile-photo-preview"), currentAccountUser);
    profileDialog.showModal();
});

document.querySelector("#profile-photo")?.addEventListener("change", (event) => {
    const file = event.target.files[0];
    const message = document.querySelector("#profile-form-message");
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        event.target.value = "";
        setDialogMessage(message, "El formato debe ser JPG, PNG o WEBP.");
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        event.target.value = "";
        setDialogMessage(message, "La imagen no puede superar 2 MB.");
        return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
        pendingPhoto = reader.result;
        applyAvatar(document.querySelector("#profile-photo-preview"), {
            ...currentAccountUser,
            photo: pendingPhoto,
        });
        setDialogMessage(message, "Imagen válida y lista para guardar.", false);
    });
    reader.readAsDataURL(file);
});

profileForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#profile-form-message");
    const name = profileForm.elements.name.value.trim();
    const email = profileForm.elements.email.value.trim().toLowerCase();

    if (!name || !email || !profileForm.elements.district.value) {
        setDialogMessage(message, "Completa nombre, correo y distrito.");
        return;
    }

    if (!profileForm.elements.email.validity.valid) {
        setDialogMessage(message, "Ingresa un correo electrónico válido.");
        return;
    }

    const usersWithEmail = await accountStore.list("users", { email });
    if (usersWithEmail.some((user) => String(user.id) !== String(currentAccountUser.id))) {
        setDialogMessage(message, "Ese correo ya pertenece a otra cuenta.");
        return;
    }

    try {
        currentAccountUser = await accountStore.update("users", currentAccountUser.id, {
            name,
            email,
            district: profileForm.elements.district.value,
            bio: profileForm.elements.bio.value.trim(),
            photo: pendingPhoto || currentAccountUser.photo || initialsFor(name),
        });
        renderCurrentUser();
        profileDialog.close();
        showAccountToast("Perfil actualizado correctamente");
    } catch (error) {
        setDialogMessage(message, error.message);
    }
});

const openSkillDialog = (kind) => {
    const isTeaching = kind === "teach";
    document.querySelector("#skill-kind").value = kind;
    document.querySelector("#skill-dialog-eyebrow").textContent = isTeaching ? "Lo que compartes" : "Lo que buscas";
    document.querySelector("#skill-dialog-title").textContent = isTeaching ? "Agregar habilidad" : "Agregar interés";
    document.querySelector("#skill-field-label").textContent = isTeaching ? "Habilidad que puedes enseñar" : "Habilidad que deseas aprender";
    document.querySelector("#skill-name").value = "";
    setDialogMessage(document.querySelector("#skill-form-message"), "");
    skillDialog.showModal();
    document.querySelector("#skill-name").focus();
};

document.querySelector("#add-teaching-skill")?.addEventListener("click", () => openSkillDialog("teach"));
document.querySelector("#add-learning-interest")?.addEventListener("click", () => openSkillDialog("learn"));

skillForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = document.querySelector("#skill-name").value.trim();
    const kind = document.querySelector("#skill-kind").value;
    const property = kind === "teach" ? "skillsTeach" : "skillsLearn";
    const message = document.querySelector("#skill-form-message");

    if (!value) {
        setDialogMessage(message, "Escribe una habilidad antes de agregarla.");
        return;
    }

    const existing = currentAccountUser[property] || [];
    if (existing.some((item) => item.toLowerCase() === value.toLowerCase())) {
        setDialogMessage(message, "Esta habilidad ya está registrada.");
        return;
    }

    currentAccountUser = await accountStore.update("users", currentAccountUser.id, {
        [property]: [...existing, value],
    });
    renderCurrentUser();
    skillDialog.close();
    showAccountToast(kind === "teach" ? "Habilidad agregada" : "Interés agregado");
});

document.querySelectorAll(".editable-tags").forEach((container) => {
    container.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-remove-profile-tag]");
        if (!button) return;

        const property = button.dataset.removeProfileTag === "teach" ? "skillsTeach" : "skillsLearn";
        const nextValues = (currentAccountUser[property] || []).filter((value) => value !== button.dataset.tagValue);
        currentAccountUser = await accountStore.update("users", currentAccountUser.id, {
            [property]: nextValues,
        });
        renderCurrentUser();
        showAccountToast("Elemento eliminado del perfil");
    });
});

document.querySelector("#save-availability")?.addEventListener("click", async () => {
    const availability = [...document.querySelectorAll(".availability-grid label")].map((label) => ({
        day: label.querySelector("span").textContent.trim(),
        enabled: label.querySelector("input").checked,
        range: label.querySelector("input").checked
            ? label.querySelector("small").textContent.trim().replace("No disponible", "18:00 - 20:00")
            : "No disponible",
    }));

    currentAccountUser = await accountStore.update("users", currentAccountUser.id, { availability });
    renderCurrentUser();
    showAccountToast("Disponibilidad actualizada");
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelector(`#${button.dataset.closeDialog}`)?.close();
    });
});

document.querySelector("#sign-out")?.addEventListener("click", () => {
    accountStore.signOut();
    window.location.assign("./auth.html");
});

loadCurrentUser().catch((error) => {
    showAccountToast(error.message || "No se pudo cargar la cuenta", true);
});

window.addEventListener("skillswap:account-updated", async () => {
    currentAccountUser = await accountStore.getCurrentUser();
    renderCurrentUser();
});
