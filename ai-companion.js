const aiPanel = document.querySelector(".ai-panel");
const aiFab = document.querySelector(".ai-fab");
const aiClose = document.querySelector(".ai-close");
const aiForm = document.querySelector(".ai-form");
const aiInput = document.querySelector(".ai-input");
const aiMessages = document.querySelector(".ai-messages");
const aiMode = document.querySelector(".ai-mode");

const defaultAnswer =
  "Great question! I can help with ordering, delivery, support, and pricing. Try asking about delivery time, support, or signing in.";

const getOrCreateUserId = () => {
  const existing = localStorage.getItem("netfoodixUserId");
  if (existing) {
    return existing;
  }
  const created = `user-${crypto.randomUUID()}`;
  localStorage.setItem("netfoodixUserId", created);
  return created;
};

const userId = getOrCreateUserId();
let conversationId = localStorage.getItem("netfoodixConversationId") || "";
let hasLoadedHistory = false;

const appendMessage = ({ text, type = "user", imageUrl, isLoading = false }) => {
  const message = document.createElement("div");
  message.className = `ai-message ai-message--${type}`;

  if (isLoading) {
    message.classList.add("ai-message--loading");
  }

  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = text || "Generated image";
    message.appendChild(image);
  }

  if (text) {
    const paragraph = document.createElement("p");
    paragraph.className = "ai-message-text";
    paragraph.textContent = text;
    message.appendChild(paragraph);
  }

  aiMessages.appendChild(message);
  aiMessages.scrollTop = aiMessages.scrollHeight;
  return message;
};

const resetMessages = () => {
  aiMessages.innerHTML = "";
  appendMessage({
    text: "Hi! I can help with Netfoodix questions, stream responses in real time, and generate images.",
    type: "bot",
  });
};

const updatePlaceholder = () => {
  aiInput.placeholder =
    aiMode?.value === "image"
      ? "Describe the image you want to create..."
      : "Ask anything about Netfoodix, orders, support, or features...";
};

const openPanel = async () => {
  aiPanel.classList.add("is-open");
  aiFab.setAttribute("aria-expanded", "true");

  if (!hasLoadedHistory) {
    await loadHistory();
  }

  aiInput.focus();
};

const closePanel = () => {
  aiPanel.classList.remove("is-open");
  aiFab.setAttribute("aria-expanded", "false");
};

const createConversation = async () => {
  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, title: "Netfoodix AI chat" }),
  });

  if (!response.ok) {
    throw new Error("Failed to create conversation");
  }

  const data = await response.json();
  conversationId = data.conversationId;
  localStorage.setItem("netfoodixConversationId", conversationId);
};

const loadHistory = async () => {
  hasLoadedHistory = true;

  if (!conversationId) {
    resetMessages();
    return;
  }

  try {
    const response = await fetch(`/api/messages/${conversationId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch history");
    }

    const data = await response.json();
    if (!Array.isArray(data.messages) || data.messages.length === 0) {
      resetMessages();
      return;
    }

    aiMessages.innerHTML = "";
    for (const message of data.messages) {
      appendMessage({
        text: message.content,
        type: message.role === "assistant" ? "bot" : "user",
      });
    }
  } catch {
    resetMessages();
  }
};

const streamChatResponse = async (message, botMessageElement) => {
  const response = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, conversationId, message }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Stream request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      if (!event.startsWith("data: ")) {
        continue;
      }

      const payload = event.slice(6);
      if (!payload) {
        continue;
      }

      const parsed = JSON.parse(payload);

      if (parsed.error) {
        throw new Error(parsed.error);
      }

      if (parsed.conversationId) {
        conversationId = parsed.conversationId;
        localStorage.setItem("netfoodixConversationId", conversationId);
      }

      if (parsed.delta) {
        fullText += parsed.delta;
        const textNode = botMessageElement.querySelector(".ai-message-text");
        if (textNode) {
          textNode.textContent = fullText;
        }
        aiMessages.scrollTop = aiMessages.scrollHeight;
      }
    }
  }

  if (!fullText.trim()) {
    const textNode = botMessageElement.querySelector(".ai-message-text");
    if (textNode) {
      textNode.textContent = defaultAnswer;
    }
  }

  botMessageElement.classList.remove("ai-message--loading");
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

  if (!conversationId) {
    try {
      await createConversation();
    } catch {
      // Conversation will be lazily created by the backend stream endpoint.
    }
  }

  appendMessage({ text: message, type: "user" });
  aiInput.value = "";

  const mode = aiMode?.value || "chat";

  try {
    if (mode === "image") {
      const loading = appendMessage({
        text: "Generating image...",
        type: "bot",
        isLoading: true,
      });

      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, conversationId, prompt: message }),
      });

      if (!response.ok) {
        throw new Error("Image request failed");
      }

      const data = await response.json();
      if (data.conversationId) {
        conversationId = data.conversationId;
        localStorage.setItem("netfoodixConversationId", conversationId);
      }

      loading.remove();
      appendMessage({
        text: "Here is your generated image:",
        type: "bot",
        imageUrl: data.image,
      });
      return;
    }

    const botMessage = appendMessage({
      text: "",
      type: "bot",
      isLoading: true,
    });

    await streamChatResponse(message, botMessage);
  } catch {
    appendMessage({
      text:
        "I couldn't complete that request right now. Please check OPENAI_API_KEY and try again.",
      type: "bot",
    });
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && aiPanel.classList.contains("is-open")) {
    closePanel();
  }
});
