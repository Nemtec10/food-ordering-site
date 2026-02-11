const aiPanel = document.querySelector('.ai-panel');
const aiFab = document.querySelector('.ai-fab');
const aiClose = document.querySelector('.ai-close');
const aiForm = document.querySelector('.ai-form');
const aiInput = document.querySelector('.ai-input');
const aiMessages = document.querySelector('.ai-messages');
const aiMode = document.querySelector('.ai-mode');
const aiAuth = document.querySelector('.ai-auth');
const aiAuthForm = document.querySelector('.ai-auth-form');
const aiAuthStatus = document.querySelector('.ai-auth-status');
const aiLogout = document.querySelector('.ai-logout');

let token = localStorage.getItem('netfoodixAuthToken') || '';
let userId = localStorage.getItem('netfoodixUserId') || '';
let conversationId = localStorage.getItem('netfoodixConversationId') || '';
let hasLoadedHistory = false;
let isDemoMode = localStorage.getItem('netfoodixDemoMode') === 'true';

const getDemoFallbackResponse = (message = '') => {
  const normalized = message.toLowerCase();
  if (/(delivery|track|order)/.test(normalized)) {
    return 'Demo fallback: track orders in My Orders > Track to see ETA and rider location.';
  }
  if (/(price|fee|cost|bill|tip|tax|split|calculate|math)/.test(normalized)) {
    return 'Demo fallback: include details like "Bill 200 tip 10% tax 8% split 4" and I will calculate it.';
  }
  if (/(where|location|address|near|nearest|kfc|restaurant)/.test(normalized)) {
    return 'Demo fallback: I could not reach live web sources right now, but you can ask with a URL like "summarize https://example.com" for direct browsing context.';
  }
  return 'Demo fallback: add a webpage URL or ask a location question and I will try to browse and summarize helpful info.';
};

const appendMessage = ({ text = '', type = 'user', imageUrl, isLoading = false }) => {
  const message = document.createElement('div');
  message.className = `ai-message ai-message--${type}`;

  if (isLoading) {
    message.classList.add('ai-message--loading');
    const thinkingWrap = document.createElement('div');
    thinkingWrap.className = 'ai-thinking';

    const thinkingImage = document.createElement('div');
    thinkingImage.className = 'ai-thinking-icon ai-thinking-icon--badge';
    thinkingImage.setAttribute('aria-hidden', 'true');
    thinkingImage.textContent = 'FY9V';

    const thinkingText = document.createElement('p');
    thinkingText.className = 'ai-thinking-text';
    thinkingText.textContent = 'Netfoodix AI is thinking';

    thinkingWrap.appendChild(thinkingImage);
    thinkingWrap.appendChild(thinkingText);
    message.appendChild(thinkingWrap);
  } else {
    if (imageUrl) {
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = text || 'Generated image';
      message.appendChild(image);
    }

    const paragraph = document.createElement('p');
    paragraph.className = 'ai-message-text';
    paragraph.textContent = text;
    message.appendChild(paragraph);
  }

  aiMessages.appendChild(message);
  aiMessages.scrollTop = aiMessages.scrollHeight;
  return message;
};

const setAuthStatus = (text, isError = false) => {
  if (!aiAuthStatus) return;
  aiAuthStatus.textContent = text;
  aiAuthStatus.style.color = isError ? '#ff9494' : 'var(--muted)';
};

const setAiEnabled = (enabled) => {
  if (aiAuth) aiAuth.style.display = enabled ? 'none' : 'block';
  if (aiForm) aiForm.style.display = enabled ? 'flex' : 'none';
  if (aiLogout) aiLogout.style.display = enabled ? 'inline-flex' : 'none';
  if (!enabled) {
    aiMessages.innerHTML = '';
    appendMessage({ text: 'Please sign in to access Netfoodix AI.', type: 'bot' });
  }
};

const authFetch = async (url, options = {}) => {
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

const ensureMessageTextNode = (messageElement) => {
  let textNode = messageElement.querySelector('.ai-message-text');
  if (textNode) {
    return textNode;
  }

  const thinking = messageElement.querySelector('.ai-thinking');
  if (thinking) {
    thinking.remove();
  }

  textNode = document.createElement('p');
  textNode.className = 'ai-message-text';
  textNode.textContent = '';
  messageElement.appendChild(textNode);
  messageElement.classList.remove('ai-message--loading');
  return textNode;
};

const verifySession = async () => {
  if (isDemoMode) {
    setAiEnabled(true);
    return true;
  }

  if (!token) {
    setAiEnabled(false);
    return false;
  }

  try {
    const response = await authFetch('/api/auth/me');
    if (!response.ok) throw new Error('invalid session');
    const data = await response.json();
    userId = data.user?.id || userId;
    localStorage.setItem('netfoodixUserId', userId);
    setAiEnabled(true);
    return true;
  } catch {
    token = '';
    userId = '';
    conversationId = '';
    localStorage.removeItem('netfoodixAuthToken');
    localStorage.removeItem('netfoodixUserId');
    localStorage.removeItem('netfoodixConversationId');
    setAiEnabled(false);
    return false;
  }
};

const loadHistory = async () => {
  hasLoadedHistory = true;

  if (isDemoMode) {
    aiMessages.innerHTML = '';
    appendMessage({
      text: 'Welcome to Demo Mode. Ask a question to preview how Netfoodix AI behaves.',
      type: 'bot',
    });
    return;
  }

  if (!conversationId) {
    aiMessages.innerHTML = '';
    appendMessage({ text: 'Hi! Ask me anything about Netfoodix.', type: 'bot' });
    return;
  }

  try {
    const response = await authFetch(`/api/messages/${conversationId}`);
    if (!response.ok) throw new Error('history failed');
    const data = await response.json();
    aiMessages.innerHTML = '';
    for (const message of data.messages || []) {
      appendMessage({ text: message.content, type: message.role === 'assistant' ? 'bot' : 'user' });
    }
  } catch {
    aiMessages.innerHTML = '';
    appendMessage({ text: 'Could not load old chat history yet.', type: 'bot' });
  }
};

const updatePlaceholder = () => {
  aiInput.placeholder =
    aiMode?.value === 'image'
      ? 'Describe the image you want to create...'
      : 'Ask anything about Netfoodix...';
};

const openPanel = async () => {
  aiPanel.classList.add('is-open');
  aiFab.setAttribute('aria-expanded', 'true');
  const loggedIn = await verifySession();
  if (loggedIn && !hasLoadedHistory) {
    await loadHistory();
  }
  aiInput.focus();
};

const closePanel = () => {
  aiPanel.classList.remove('is-open');
  aiFab.setAttribute('aria-expanded', 'false');
};

const enableDemoMode = async () => {
  isDemoMode = true;
  token = '';
  userId = '';
  conversationId = '';
  hasLoadedHistory = false;
  localStorage.removeItem('netfoodixAuthToken');
  localStorage.removeItem('netfoodixUserId');
  localStorage.removeItem('netfoodixConversationId');
  localStorage.setItem('netfoodixDemoMode', 'true');
  setAuthStatus('Demo mode enabled.');
  setAiEnabled(true);
  await loadHistory();
};

const handleAuthAction = async (mode) => {
  if (mode === 'demo') {
    await enableDemoMode();
    return;
  }

  const formData = new FormData(aiAuthForm);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();

  if (!email || !password) {
    setAuthStatus('Email and password are required.', true);
    return;
  }

  setAuthStatus(mode === 'signup' ? 'Creating account...' : 'Signing in...');
  const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    isDemoMode = false;
    localStorage.removeItem('netfoodixDemoMode');
    token = data.token;
    userId = data.user.id;
    localStorage.setItem('netfoodixAuthToken', token);
    localStorage.setItem('netfoodixUserId', userId);
    setAuthStatus('Signed in successfully.');
    setAiEnabled(true);
    hasLoadedHistory = false;
    await loadHistory();
  } catch (error) {
    setAuthStatus(error.message || 'Authentication failed.', true);
  }
};

const streamChatResponse = async (message, botMessageElement) => {
  const response = await authFetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, message }),
  });

  if (!response.ok || !response.body) {
    const errorData = await response.json().catch(() => ({ error: 'Stream request failed' }));
    throw new Error(errorData.error || 'Stream request failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      if (!event.startsWith('data: ')) continue;
      const parsed = JSON.parse(event.slice(6));
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.conversationId) {
        conversationId = parsed.conversationId;
        localStorage.setItem('netfoodixConversationId', conversationId);
      }
      if (parsed.delta) {
        fullText += parsed.delta;
        const textNode = ensureMessageTextNode(botMessageElement);
        textNode.textContent = fullText;
      }
    }
  }

  botMessageElement.classList.remove('ai-message--loading');
};

const runDemoResponse = async (message, botMessageElement) => {
  try {
    const response = await fetch('/api/demo/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Demo browsing is unavailable right now.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        if (!event.startsWith('data: ')) continue;
        const parsed = JSON.parse(event.slice(6));
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.delta) {
          fullText += parsed.delta;
          const textNode = ensureMessageTextNode(botMessageElement);
          textNode.textContent = fullText;
        }
      }
    }

    if (!fullText.trim()) {
      const textNode = ensureMessageTextNode(botMessageElement);
      textNode.textContent = getDemoFallbackResponse(message);
    }

    botMessageElement.classList.remove('ai-message--loading');
  } catch {
    const textNode = ensureMessageTextNode(botMessageElement);
    textNode.textContent = getDemoFallbackResponse(message);
    botMessageElement.classList.remove('ai-message--loading');
  }
};

aiFab.addEventListener('click', () => {
  if (aiPanel.classList.contains('is-open')) closePanel();
  else openPanel();
});

aiClose.addEventListener('click', closePanel);
aiMode?.addEventListener('change', updatePlaceholder);
updatePlaceholder();

aiAuth?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-auth-action]');
  if (!button) return;
  await handleAuthAction(button.dataset.authAction);
});

aiLogout?.addEventListener('click', async () => {
  if (token) {
    await authFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }
  token = '';
  userId = '';
  conversationId = '';
  isDemoMode = false;
  localStorage.removeItem('netfoodixAuthToken');
  localStorage.removeItem('netfoodixUserId');
  localStorage.removeItem('netfoodixConversationId');
  localStorage.removeItem('netfoodixDemoMode');
  setAuthStatus('Logged out.');
  setAiEnabled(false);
});

aiForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = aiInput.value.trim();
  if (!message) return;

  appendMessage({ text: message, type: 'user' });
  aiInput.value = '';

  try {
    const botMessage = appendMessage({ text: '', type: 'bot', isLoading: true });

    if (isDemoMode) {
      await runDemoResponse(message, botMessage);
      return;
    }

    if ((aiMode?.value || 'chat') === 'image') {
      const response = await authFetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, prompt: message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Image failed');
      if (data.conversationId) {
        conversationId = data.conversationId;
        localStorage.setItem('netfoodixConversationId', conversationId);
      }

      botMessage.innerHTML = '';
      botMessage.classList.remove('ai-message--loading');
      const textNode = document.createElement('p');
      textNode.className = 'ai-message-text';
      textNode.textContent = 'Here is your generated image:';
      botMessage.appendChild(textNode);
      const image = document.createElement('img');
      image.src = data.image;
      image.alt = 'Generated image';
      botMessage.appendChild(image);
      return;
    }

    await streamChatResponse(message, botMessage);
  } catch (error) {
    appendMessage({ text: error.message || 'Request failed.', type: 'bot' });
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && aiPanel.classList.contains('is-open')) {
    closePanel();
  }
});

setAiEnabled(false);
verifySession();
