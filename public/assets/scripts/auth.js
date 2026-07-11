const store = window.SkillSwapStore;
const authTabs = document.querySelectorAll("[data-auth-tab]");
const authViews = document.querySelectorAll("[data-auth-view]");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const authToast = document.querySelector("#auth-toast");
let toastTimer;

const refreshIcons = () => window.lucide?.createIcons();

const showToast = (message) => {
    window.clearTimeout(toastTimer);
    authToast.querySelector("span").textContent = message;
    authToast.hidden = false;
    toastTimer = window.setTimeout(() => {
        authToast.hidden = true;
    }, 2600);
};

const switchAuthView = (viewName) => {
    authTabs.forEach((tab) => {
        const isSelected = tab.dataset.authTab === viewName;
        tab.classList.toggle("is-active", isSelected);
        tab.setAttribute("aria-selected", String(isSelected));
    });

    authViews.forEach((view) => {
        const isSelected = view.dataset.authView === viewName;
        view.hidden = !isSelected;
        view.classList.toggle("is-visible", isSelected);
    });
};

const setFormMessage = (element, message, type = "error") => {
    element.textContent = message;
    element.dataset.type = type;
    element.hidden = !message;
};

const clearFieldErrors = (form) => {
    form.querySelectorAll(".field").forEach((field) => field.classList.remove("has-error"));
    form.querySelectorAll(".field-error").forEach((error) => {
        error.textContent = "";
    });
};

const markFieldError = (input, message) => {
    const field = input.closest(".field");
    field?.classList.add("has-error");
    const error = field?.querySelector(".field-error");
    if (error) error.textContent = message;
};

const validateRequiredFields = (form) => {
    clearFieldErrors(form);
    let isValid = true;

    form.querySelectorAll("input[required], select[required]").forEach((input) => {
        if (input.type === "checkbox") return;

        if (!input.value.trim()) {
            markFieldError(input, "Este campo es obligatorio.");
            isValid = false;
        } else if (input.type === "email" && !input.validity.valid) {
            markFieldError(input, "Ingresa un correo válido.");
            isValid = false;
        } else if (input.minLength > 0 && input.value.length < input.minLength) {
            markFieldError(input, `Usa al menos ${input.minLength} caracteres.`);
            isValid = false;
        }
    });

    return isValid;
};

authTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchAuthView(tab.dataset.authTab));
});

document.querySelectorAll("[data-password-target]").forEach((button) => {
    button.addEventListener("click", () => {
        const input = document.querySelector(`#${button.dataset.passwordTarget}`);
        const shouldShow = input.type === "password";
        input.type = shouldShow ? "text" : "password";
        button.setAttribute("aria-label", shouldShow ? "Ocultar contraseña" : "Mostrar contraseña");
        button.innerHTML = `<i data-lucide="${shouldShow ? "eye-off" : "eye"}" aria-hidden="true"></i>`;
        refreshIcons();
    });
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFormMessage(document.querySelector("#login-message"), "");
    if (!validateRequiredFields(loginForm)) return;

    const submitButton = loginForm.querySelector("[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Validando...";

    try {
        await store.authenticate(
            loginForm.elements.email.value.trim().toLowerCase(),
            loginForm.elements.password.value,
        );
        setFormMessage(document.querySelector("#login-message"), "Acceso correcto. Abriendo tu espacio...", "success");
        window.setTimeout(() => window.location.assign("./app.html#home"), 450);
    } catch (error) {
        setFormMessage(document.querySelector("#login-message"), error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Ingresar <i data-lucide="arrow-right" aria-hidden="true"></i>';
        refreshIcons();
    }
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFormMessage(document.querySelector("#register-message"), "");

    const hasRequiredFields = validateRequiredFields(registerForm);
    if (!registerForm.elements.terms.checked) {
        setFormMessage(document.querySelector("#register-message"), "Debes aceptar los términos para crear la cuenta.");
        return;
    }
    if (!hasRequiredFields) return;

    const email = registerForm.elements.email.value.trim().toLowerCase();
    const existingUsers = await store.list("users", { email });
    if (existingUsers.length) {
        markFieldError(registerForm.elements.email, "Ya existe una cuenta con este correo.");
        return;
    }

    const name = registerForm.elements.name.value.trim();
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

    try {
        const user = await store.create("users", {
            name,
            email,
            password: registerForm.elements.password.value,
            district: registerForm.elements.district.value,
            bio: "",
            photo: initials,
            credits: 30,
            rating: 0,
            reviewCount: 0,
            sessions: 0,
            identityStatus: "unverified",
            phoneVerified: false,
            skillsTeach: [],
            skillsLearn: [],
            availability: [],
            blockedUserIds: [],
        });

        store.setCurrentUser(user.id);
        setFormMessage(document.querySelector("#register-message"), "Cuenta creada. Te damos 30 créditos de bienvenida.", "success");
        window.setTimeout(() => window.location.assign("./app.html#profile"), 650);
    } catch (error) {
        setFormMessage(document.querySelector("#register-message"), error.message);
    }
});

document.querySelector("#demo-login").addEventListener("click", async () => {
    document.querySelector("#login-email").value = "andrea@skillswap.live";
    document.querySelector("#login-password").value = "demo123";
    await store.authenticate("andrea@skillswap.live", "demo123");
    showToast("Cuenta de Andrea cargada");
    window.setTimeout(() => window.location.assign("./app.html#home"), 450);
});

document.querySelector("#recover-password").addEventListener("click", () => {
    const email = document.querySelector("#login-email").value.trim();
    showToast(email ? `Enlace de recuperación preparado para ${email}` : "Ingresa tu correo para recuperar el acceso");
});

store.init().catch(() => {
    setFormMessage(document.querySelector("#login-message"), "No se pudo iniciar el almacenamiento local.");
});

switchAuthView(window.location.hash === "#register" ? "register" : "login");
refreshIcons();
