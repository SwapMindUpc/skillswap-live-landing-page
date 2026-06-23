const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const filterButtons = document.querySelectorAll(".filter-pill");
const resultCards = document.querySelectorAll(".result-card");
const searchButton = document.querySelector(".search-button");
const searchInput = document.querySelector("#skill-search");
const requestButton = document.querySelector(".panel-button");

const showTemporaryLabel = (element, label) => {
    if (!element) return;

    const originalLabel = element.textContent;
    element.textContent = label;
    element.disabled = true;

    window.setTimeout(() => {
        element.textContent = originalLabel;
        element.disabled = false;
    }, 1800);
};

menuToggle?.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        menuToggle?.setAttribute("aria-expanded", "false");
    });
});

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const selectedFilter = button.dataset.filter;

        filterButtons.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");

        resultCards.forEach((card) => {
            const tags = card.dataset.tags?.split(" ") ?? [];
            const shouldShow = selectedFilter === "all" || tags.includes(selectedFilter);
            card.classList.toggle("is-hidden", !shouldShow);
        });
    });
});

searchButton?.addEventListener("click", () => {
    const skill = searchInput?.value.trim() || "habilidad";
    showTemporaryLabel(searchButton, `Buscando ${skill}`);
});

requestButton?.addEventListener("click", () => {
    showTemporaryLabel(requestButton, "Solicitud enviada");
});
