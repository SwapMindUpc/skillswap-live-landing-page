const contactStore = window.SkillSwapStore;
const contactForm = document.querySelector("#contact-form");
const contactFormMessage = document.querySelector("#contact-form-message");

const setContactMessage = (message, type = "error") => {
    contactFormMessage.textContent = message;
    contactFormMessage.dataset.type = type;
    contactFormMessage.hidden = !message;
};

contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setContactMessage("");

    const data = new FormData(contactForm);
    const name = data.get("name").trim();
    const email = data.get("email").trim().toLowerCase();
    const topic = data.get("topic");
    const message = data.get("message").trim();

    if (!name || !email || !topic || !message) {
        setContactMessage("Completa todos los campos antes de enviar.");
        return;
    }

    if (!contactForm.elements.email.validity.valid) {
        setContactMessage("Ingresa un correo electrónico válido.");
        return;
    }

    if (!contactForm.elements.consent.checked) {
        setContactMessage("Debes aceptar el uso de datos para que podamos responderte.");
        return;
    }

    const submitButton = contactForm.querySelector("[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";

    try {
        await contactStore.create("contacts", {
            name,
            email,
            topic,
            message,
            status: "new",
            createdAt: new Date().toISOString(),
        });
        contactForm.reset();
        setContactMessage("Tu mensaje fue enviado correctamente. Te responderemos pronto.", "success");
    } catch (error) {
        setContactMessage(error.message || "No se pudo enviar el mensaje. Intenta nuevamente.");
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Enviar mensaje <i data-lucide="send" aria-hidden="true"></i>';
        window.lucide?.createIcons();
    }
});

contactStore?.init().catch(() => {
    setContactMessage("El formulario no pudo iniciar el almacenamiento local.");
});

window.lucide?.createIcons();
