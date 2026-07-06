const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const filterButtons = document.querySelectorAll(".filter-pill");
const resultCards = document.querySelectorAll(".result-card");
const searchButton = document.querySelector(".search-button");
const searchInput = document.querySelector("#skill-search");
const requestButton = document.querySelector(".panel-button");
const header = document.querySelector(".header");
const progressBar = document.querySelector(".page-progress span");
const mentorPanel = document.querySelector(".mentor-panel");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const cardTimers = new WeakMap();

const showTemporaryLabel = (element, label) => {
    if (!element) return;

    const originalLabel = element.textContent;
    element.textContent = label;
    element.disabled = true;
    element.classList.add("is-success");

    window.setTimeout(() => {
        element.textContent = originalLabel;
        element.disabled = false;
        element.classList.remove("is-success");
    }, 1800);
};

const closeMenu = () => {
    navLinks?.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Abrir menú");
};

menuToggle?.addEventListener("click", () => {
    const isOpen = navLinks?.classList.toggle("is-open") ?? false;
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
});

navLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
});

document.addEventListener("click", (event) => {
    if (!navLinks?.classList.contains("is-open")) return;
    if (navLinks.contains(event.target) || menuToggle?.contains(event.target)) return;

    closeMenu();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
});

filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("active")));

    button.addEventListener("click", () => {
        const selectedFilter = button.dataset.filter;

        filterButtons.forEach((item) => {
            const isSelected = item === button;
            item.classList.toggle("active", isSelected);
            item.setAttribute("aria-pressed", String(isSelected));
        });

        button.classList.add("active");

        resultCards.forEach((card) => {
            const tags = card.dataset.tags?.split(" ") ?? [];
            const shouldShow = selectedFilter === "all" || tags.includes(selectedFilter);
            const pendingTimer = cardTimers.get(card);

            if (pendingTimer) {
                window.clearTimeout(pendingTimer);
                cardTimers.delete(card);
            }

            if (shouldShow) {
                card.classList.remove("is-hidden", "is-leaving");
                card.classList.add("is-entering");

                const enterTimer = window.setTimeout(() => {
                    card.classList.remove("is-entering");
                    cardTimers.delete(card);
                }, 430);

                cardTimers.set(card, enterTimer);
                return;
            }

            card.classList.remove("is-entering");
            card.classList.add("is-leaving");

            const leaveTimer = window.setTimeout(() => {
                card.classList.add("is-hidden");
                card.classList.remove("is-leaving");
                cardTimers.delete(card);
            }, reduceMotion.matches ? 0 : 240);

            cardTimers.set(card, leaveTimer);
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

searchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    searchButton?.click();
});

const revealGroups = [
    [".section-heading", 0],
    [".steps article", 90],
    [".search-demo", 0],
    [".feature-stack article", 100],
    [".credits-card > div", 130],
    [".trust-cards .card", 100],
    [".community-grid article", 100],
    [".cta > *", 110],
];

const revealTargets = [];

revealGroups.forEach(([selector, delayStep]) => {
    document.querySelectorAll(selector).forEach((element, index) => {
        element.classList.add("reveal-target");
        element.style.setProperty("--reveal-delay", `${Math.min(index, 4) * delayStep}ms`);
        revealTargets.push(element);
    });
});

document.querySelector(".search-demo")?.classList.add("reveal-from-left");
document.querySelectorAll(".feature-stack article").forEach((element) => {
    element.classList.add("reveal-from-right");
});

if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        {
            rootMargin: "0px 0px -10% 0px",
            threshold: 0.12,
        },
    );

    revealTargets.forEach((element) => revealObserver.observe(element));
} else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
}

const animatedScenes = document.querySelectorAll(".credits-card, .cta");

if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const sceneObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle("is-in-view", entry.isIntersecting);
            });
        },
        { threshold: 0.25 },
    );

    animatedScenes.forEach((scene) => sceneObserver.observe(scene));
}

const navigationLinks = document.querySelectorAll(".nav-links a");
const observedSections = [...navigationLinks]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
        (entries) => {
            const currentSection = entries.find((entry) => entry.isIntersecting);
            if (!currentSection) return;

            navigationLinks.forEach((link) => {
                const isCurrent = link.getAttribute("href") === `#${currentSection.target.id}`;
                link.classList.toggle("is-current", isCurrent);

                if (isCurrent) {
                    link.setAttribute("aria-current", "true");
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        },
        {
            rootMargin: "-35% 0px -55% 0px",
            threshold: 0,
        },
    );

    observedSections.forEach((section) => sectionObserver.observe(section));
}

let scrollTicking = false;

const updateScrollEffects = () => {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;

    progressBar?.style.setProperty("--scroll-progress", String(Math.min(1, progress)));
    header?.classList.toggle("is-scrolled", window.scrollY > 18);
    scrollTicking = false;
};

window.addEventListener(
    "scroll",
    () => {
        if (scrollTicking) return;

        scrollTicking = true;
        window.requestAnimationFrame(updateScrollEffects);
    },
    { passive: true },
);

updateScrollEffects();

if (mentorPanel && !reduceMotion.matches && window.matchMedia("(hover: hover)").matches) {
    mentorPanel.addEventListener("pointermove", (event) => {
        const bounds = mentorPanel.getBoundingClientRect();
        const xRatio = (event.clientX - bounds.left) / bounds.width - 0.5;
        const yRatio = (event.clientY - bounds.top) / bounds.height - 0.5;

        mentorPanel.style.setProperty("--rotate-x", `${yRatio * -5}deg`);
        mentorPanel.style.setProperty("--rotate-y", `${xRatio * 6}deg`);
    });

    mentorPanel.addEventListener("pointerleave", () => {
        mentorPanel.style.setProperty("--rotate-x", "0deg");
        mentorPanel.style.setProperty("--rotate-y", "0deg");
    });
}

window.requestAnimationFrame(() => {
    document.body.classList.add("motion-ready");
});
