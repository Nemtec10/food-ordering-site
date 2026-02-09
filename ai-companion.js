const aiPanel = document.querySelector(".ai-panel");
const aiFab = document.querySelector(".ai-fab");
const aiClose = document.querySelector(".ai-close");
const aiForm = document.querySelector(".ai-form");
const aiInput = document.querySelector(".ai-input");
const aiMessages = document.querySelector(".ai-messages");
const aiMode = document.querySelector(".ai-mode");

const fallbackResponses = [
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

const conversation = [
  {
    role: "system",
    content:
      "You are Netfoodix AI, a friendly assistant for a food ordering app. Be concise, helpful, and practical.",
  },
];

const appendMessage = ({ text, type = "user", imageUrl, isLoading = false }) => {
  const message = document.createElement("div");
  message.className = `ai-message ai-message--${type}`;
  if (isLoading) {
    message.classList.add("ai-message--loading");
    message.dataset.loading = "true";
  }

  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = text || "Generated image";
    message.appendChild(image);
  } else {
    message.textContent = text;
  }

  aiMessages.appendChild(message);
  aiMessages.scrollTop = aiMessages.scrollHeight;
};

const removeLoadingMessage = () => {
  const loading = aiMessages.querySelector('[data-loading="true"]');
  if (loading) {
    loading.remove();
  }
};

const getFallbackResponse = (message) => {
  const normalized = message.toLowerCase();
  const match = fallbackResponses.find((item) =>
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

const updatePlaceholder = () => {
  if (!aiMode) {
    return;
  }
  aiInput.placeholder =
    aiMode.value === "image"
      ? "Describe the image you want to create..."
      : "Ask about delivery, pricing, or support...";
};

aiFab.addEventListener("click", () => {
  if (aiPanel.classList.contains("is-open")) {
    closePanel();
  } else {
    openPanel();
  }
});

aiClose.addEventListener("click", closePanel);

aiMode?.addEventListener("change", updatePlaceholder);
updatePlaceholder();

aiForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = aiInput.value.trim();
  if (!message) {
    return;
  }

  appendMessage({ text: message, type: "user" });
  aiInput.value = "";
  appendMessage({ text: "Thinking…", type: "bot", isLoading: true });

  const mode = aiMode?.value || "chat";

  try {
    if (mode === "image") {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: message }),
      });

      if (!response.ok) {
        throw new Error("Image request failed");
      }

      const data = await response.json();
      removeLoadingMessage();
      appendMessage({
        text: message,
        type: "bot",
        imageUrl: data.image,
      });
      return;
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: conversation.slice(-6),
      }),
    });

    if (!response.ok) {
      throw new Error("Chat request failed");
    }

    const data = await response.json();
    const reply = data.reply || defaultAnswer;
    conversation.push({ role: "user", content: message });
    conversation.push({ role: "assistant", content: reply });
    removeLoadingMessage();
    appendMessage({ text: reply, type: "bot" });
  } catch (error) {
    removeLoadingMessage();
    if (mode === "image") {
      appendMessage({
        text:
          "I couldn't generate an image right now. Please run the server with a valid OPENAI_API_KEY.",
        type: "bot",
      });
      return;
    }
    const reply = getFallbackResponse(message);
    appendMessage({ text: reply, type: "bot" });
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && aiPanel.classList.contains("is-open")) {
    closePanel();
  }
});
