console.log("SkillSwap Live Landing Page loaded");

const buttons = document.querySelectorAll(".primary-button, .secondary-button");

buttons.forEach((button) => {
    button.addEventListener("click", () => {
        console.log("User clicked:", button.textContent);
    });
});