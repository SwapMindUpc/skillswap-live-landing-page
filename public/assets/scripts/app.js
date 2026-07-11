const viewTitles = {
    home: "Buenos días, Andrea",
    search: "Buscar mentores",
    mentorships: "Mis mentorías",
    community: "Comunidad",
    credits: "Créditos",
    profile: "Mi perfil",
};

const views = document.querySelectorAll("[data-view]");
const viewButtons = document.querySelectorAll("[data-view-target]");
const navigationButtons = document.querySelectorAll(".nav-item");
const viewTitle = document.querySelector("#view-title");
const notificationButton = document.querySelector("#notification-button");
const notificationPanel = document.querySelector("#notification-panel");
const closeNotificationsButton = document.querySelector("#close-notifications");
const mentorDialog = document.querySelector("#mentor-dialog");
const toast = document.querySelector("#app-toast");
let toastTimer;

const refreshIcons = () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }
};

const showToast = (message) => {
    if (!toast) return;

    window.clearTimeout(toastTimer);
    toast.querySelector("span").textContent = message;
    toast.hidden = false;
    toast.classList.remove("is-visible");
    window.requestAnimationFrame(() => toast.classList.add("is-visible"));

    toastTimer = window.setTimeout(() => {
        toast.classList.remove("is-visible");
        toast.hidden = true;
    }, 2400);
};

const closeNotifications = () => {
    if (!notificationPanel || !notificationButton) return;

    notificationPanel.hidden = true;
    notificationButton.setAttribute("aria-expanded", "false");
};

const showView = (viewName, updateHistory = true) => {
    const nextView = document.querySelector(`[data-view="${viewName}"]`);
    if (!nextView) return;

    views.forEach((view) => {
        const isCurrent = view === nextView;
        view.hidden = !isCurrent;
        view.classList.toggle("is-visible", isCurrent);
    });

    navigationButtons.forEach((button) => {
        const isCurrent = button.dataset.viewTarget === viewName;
        button.classList.toggle("is-active", isCurrent);

        if (isCurrent) {
            button.setAttribute("aria-current", "page");

            if (window.matchMedia("(max-width: 920px)").matches) {
                const navigation = button.closest(".side-nav");
                const centeredPosition = button.offsetLeft
                    - ((navigation?.clientWidth ?? 0) - button.clientWidth) / 2;

                navigation?.scrollTo({
                    left: Math.max(0, centeredPosition),
                    behavior: "smooth",
                });
            }
        } else {
            button.removeAttribute("aria-current");
        }
    });

    if (viewTitle) {
        viewTitle.textContent = viewTitles[viewName] ?? "SkillSwap Live";
    }

    if (updateHistory) {
        window.history.replaceState(null, "", `#${viewName}`);
    }

    closeNotifications();
    window.scrollTo({ top: 0, behavior: "smooth" });
};

viewButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewTarget));
});

document.querySelector("#quick-search-button")?.addEventListener("click", () => showView("search"));

notificationButton?.addEventListener("click", () => {
    const isOpen = notificationPanel?.hidden ?? true;
    if (!notificationPanel) return;

    notificationPanel.hidden = !isOpen;
    notificationButton.setAttribute("aria-expanded", String(isOpen));
});

closeNotificationsButton?.addEventListener("click", closeNotifications);

document.addEventListener("click", (event) => {
    if (notificationPanel?.hidden) return;
    if (notificationPanel?.contains(event.target) || notificationButton?.contains(event.target)) return;

    closeNotifications();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeNotifications();
    }
});

const mentorCards = [...document.querySelectorAll(".result-mentor")];
const searchInput = document.querySelector("#mentor-search");
const modalityFilter = document.querySelector("#modality-filter");
const locationFilter = document.querySelector("#location-filter");
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#search-empty-state");
const ratingButtons = document.querySelectorAll(".filter-chip[data-rating]");
const favoritesFilter = document.querySelector("#favorites-filter");
let selectedRatingFilter = "all";
let showFavoritesOnly = false;

const normalizeText = (value) => value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const applyMentorFilters = () => {
    const query = normalizeText(searchInput?.value.trim() ?? "");
    const modality = modalityFilter?.value ?? "all";
    const location = locationFilter?.value ?? "all";
    let visibleCount = 0;

    mentorCards.forEach((card) => {
        const searchableText = normalizeText(`${card.dataset.name} ${card.dataset.skill}`);
        const tags = card.dataset.tags?.split(" ") ?? [];
        const favoriteButton = card.querySelector(".favorite-button");
        const matchesText = !query || searchableText.includes(query);
        const matchesModality = modality === "all" || card.dataset.modality === modality;
        const matchesLocation = location === "all" || card.dataset.location === location;
        const matchesRating = selectedRatingFilter === "all"
            || tags.includes(selectedRatingFilter);
        const matchesFavorite = !showFavoritesOnly || favoriteButton?.classList.contains("is-favorite");
        const shouldShow = matchesText
            && matchesModality
            && matchesLocation
            && matchesRating
            && matchesFavorite;

        card.classList.toggle("is-filtered", !shouldShow);
        if (shouldShow) visibleCount += 1;
    });

    if (resultCount) {
        resultCount.textContent = `${visibleCount} ${visibleCount === 1 ? "mentor" : "mentores"}`;
    }

    if (emptyState) {
        emptyState.hidden = visibleCount !== 0;
    }
};

document.querySelector("#mentor-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    applyMentorFilters();
});

searchInput?.addEventListener("input", applyMentorFilters);
modalityFilter?.addEventListener("change", applyMentorFilters);
locationFilter?.addEventListener("change", applyMentorFilters);

ratingButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectedRatingFilter = button.dataset.rating;

        ratingButtons.forEach((item) => {
            item.classList.toggle("is-active", item === button);
        });

        applyMentorFilters();
    });
});

favoritesFilter?.addEventListener("click", () => {
    showFavoritesOnly = !showFavoritesOnly;
    favoritesFilter.setAttribute("aria-pressed", String(showFavoritesOnly));
    favoritesFilter.classList.toggle("is-selected", showFavoritesOnly);
    applyMentorFilters();
});

document.querySelector("#clear-search")?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (modalityFilter) modalityFilter.value = "all";
    if (locationFilter) locationFilter.value = "all";
    selectedRatingFilter = "all";
    showFavoritesOnly = false;
    favoritesFilter?.setAttribute("aria-pressed", "false");

    ratingButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.rating === "all");
    });

    applyMentorFilters();
});

const sortFilter = document.querySelector("#sort-filter");
const mentorResults = document.querySelector("#mentor-results");

sortFilter?.addEventListener("change", () => {
    const sortedCards = [...mentorCards].sort((first, second) => {
        if (sortFilter.value === "rating") {
            return Number(second.dataset.rating) - Number(first.dataset.rating);
        }

        if (sortFilter.value === "credits") {
            return Number(first.dataset.credits) - Number(second.dataset.credits);
        }

        return mentorCards.indexOf(first) - mentorCards.indexOf(second);
    });

    sortedCards.forEach((card) => mentorResults?.append(card));
});

document.querySelectorAll(".mentor-details-button").forEach((button) => {
    button.addEventListener("click", () => {
        const card = button.closest(".mentor-card");
        const name = card?.dataset.name ?? card?.querySelector("h3")?.textContent ?? "Mentor";
        const skill = card?.dataset.skill ?? card?.querySelector("p")?.textContent ?? "";
        const mentorIdsByName = {
            "José Paredes": "2",
            "Grecia Ascarza": "3",
            "Jhoel Armas": "4",
            "Lucía Velarde": "5",
            "Mariana Torres": "6",
            "Jeferson Contreras": "7",
        };
        const initials = name
            .split(" ")
            .slice(0, 2)
            .map((word) => word[0])
            .join("");

        const dialogName = document.querySelector("#dialog-name");
        const dialogSkill = document.querySelector("#dialog-skill");
        const dialogAvatar = document.querySelector("#dialog-avatar");

        if (dialogName) dialogName.textContent = name;
        if (dialogSkill) dialogSkill.textContent = skill;
        if (dialogAvatar) dialogAvatar.textContent = initials;
        mentorDialog.dataset.mentorId = card?.dataset.mentorId || mentorIdsByName[name] || "2";
        mentorDialog?.showModal();
    });
});

document.querySelectorAll(".time-options button").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".time-options button").forEach((item) => {
            item.classList.toggle("is-selected", item === button);
        });
    });
});

const sessionFilterButtons = document.querySelectorAll("[data-session-filter]");
const sessionCards = document.querySelectorAll("[data-session-status]");

sessionFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const filter = button.dataset.sessionFilter;

        sessionFilterButtons.forEach((item) => {
            const isActive = item === button;
            item.classList.toggle("is-active", isActive);
            item.setAttribute("aria-selected", String(isActive));
        });

        sessionCards.forEach((card) => {
            card.hidden = card.dataset.sessionStatus !== filter;
        });
    });
});

const transactionFilter = document.querySelector("#transaction-filter");

transactionFilter?.addEventListener("change", () => {
    document.querySelectorAll("[data-transaction]").forEach((transaction) => {
        transaction.hidden = transactionFilter.value !== "all"
            && transaction.dataset.transaction !== transactionFilter.value;
    });
});

const initialView = window.location.hash.replace("#", "");
showView(viewTitles[initialView] ? initialView : "home", false);
applyMentorFilters();
refreshIcons();
