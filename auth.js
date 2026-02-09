const authTriggers = document.querySelectorAll(".auth-trigger");
const authModal = document.querySelector(".auth-modal");
const authPanel = document.querySelector(".auth-modal__panel");
const authTitle = document.querySelector("#auth-title");
const authForm = document.querySelector(".auth-form");
const authSwitch = document.querySelector("[data-auth-switch]");
const authCloseButtons = document.querySelectorAll("[data-auth-close]");

const setAuthMode = (mode) => {
  if (!authTitle) return;
  if (mode === "signup") {
    authTitle.textContent = "Create your Netfoodix account";
    authForm?.querySelector('button[type="submit"]')?.setAttribute("data-mode", "signup");
  } else {
    authTitle.textContent = "Welcome back";
    authForm?.querySelector('button[type="submit"]')?.setAttribute("data-mode", "signin");
  }
};

const openAuthModal = (mode = "signin") => {
  setAuthMode(mode);
  authModal?.setAttribute("aria-hidden", "false");
  authModal?.classList.add("is-open");
  authPanel?.querySelector("input")?.focus();
};

const closeAuthModal = () => {
  authModal?.setAttribute("aria-hidden", "true");
  authModal?.classList.remove("is-open");
};

authTriggers.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.auth || "signin";
    openAuthModal(mode);
  });
});

authCloseButtons.forEach((button) => {
  button.addEventListener("click", closeAuthModal);
});

authSwitch?.addEventListener("click", () => {
  openAuthModal("signup");
});

authForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const mode = authForm
    .querySelector('button[type="submit"]')
    ?.getAttribute("data-mode");
  const successMessage =
    mode === "signup"
      ? "Account created! Please check your email to verify your account."
      : "Signed in! Redirecting you to your dashboard...";
  alert(successMessage);
  closeAuthModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && authModal?.classList.contains("is-open")) {
    closeAuthModal();
  }
});
