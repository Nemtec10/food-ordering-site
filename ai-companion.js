const aiPanel = document.querySelector(".ai-panel");
const aiFab = document.querySelector(".ai-fab");
const aiClose = document.querySelector(".ai-close");
const aiForm = document.querySelector(".ai-form");
const aiInput = document.querySelector(".ai-input");
const aiMessages = document.querySelector(".ai-messages");

const responses = [
  {
    keywords: ["price", "pricing", "cost", "plan", "subscription"],
    answer:
      "Netfoodix offers flexible plans for individuals and restaurants. Ask support for the latest pricing or check the Pricing section.",
  },
  {
    keywords: ["delivery", "deliver", "time", "fast", "track"],
    answer:
      "Delivery times depend on distance and restaurant prep time. You can track your order in real time once it is placed.",
  },
  {
    keywords: ["support", "help", "contact", "customer"],
    answer:
      "You can reach support using the Contact Us page or the Support section. We respond within 24 hours.",
  },
  {
    keywords: ["account", "sign", "login", "signup"],
    answer:
      "Tap Sign-in or Get Started to create your account. You can also recover your password from the login screen.",
  },
  {
    keywords: ["restaurant", "partner", "join"],
    answer:
      "Restaurants can join by completing the partner form in the Services section. We onboard partners within a few days.",
  },
];

const defaultAnswer =
  "Great question! I can help with ordering, delivery, support, and pricing. Try asking about delivery time, support, or signing in.";

const appendMessage = (text, type = "user") => {
  const message = document.createElement("div");
  message.className = `ai-message ai-message--${type}`;
  message.textContent = text;
  aiMessages.appendChild(message);
  aiMessages.scrollTop = aiMessages.scrollHeight;
};

const getResponse = (message) => {
  const normalized = message.toLowerCase();
  const match = responses.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword))
  );
  return match ? match.answer : defaultAnswer;
};

const openPanel = () => {
  aiPanel.classList.add("is-open");
  aiFab.setAttribute("aria-expanded", "true");
  aiInput.focus();
};

const closePanel = () => {
  aiPanel.classList.remove("is-open");
  aiFab.setAttribute("aria-expanded", "false");
};

aiFab.addEventListener("click", () => {
  if (aiPanel.classList.contains("is-open")) {
    closePanel();
  } else {
    openPanel();
  }
});

aiClose.addEventListener("click", closePanel);

aiForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = aiInput.value.trim();
  if (!message) {
    return;
  }
  appendMessage(message, "user");
  aiInput.value = "";

  const reply = getResponse(message);
  window.setTimeout(() => appendMessage(reply, "bot"), 300);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && aiPanel.classList.contains("is-open")) {
    closePanel();
  }
});
