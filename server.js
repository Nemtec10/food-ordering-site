import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import { DatabaseSync } from "node:sqlite";
import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

const systemPrompt =
  "You are Netfoodix AI, a friendly assistant for a food ordering app. Be concise, helpful, and practical.";

const chunkText = (text, size = 160) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
};

const extractUrls = (text = "") => {
  const matches = text.match(/https?:\/\/[^\s)]+/gi) || [];
  return [...new Set(matches)].slice(0, 3);
};

const summarizeHtml = (html = "") => {
  const noScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");

  return noScripts
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1800);
};

const fetchWebContext = async (message) => {
  const urls = extractUrls(message);
  if (!urls.length) {
    return [];
  }

  const contexts = [];
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "NetfoodixAI/1.0" },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        contexts.push({ url, summary: `Could not fetch page (HTTP ${response.status}).` });
        continue;
      }

      const html = await response.text();
      const summary = summarizeHtml(html);
      contexts.push({ url, summary: summary || "No readable text found on this page." });
    } catch {
      contexts.push({ url, summary: "Could not fetch this URL due to timeout or network issue." });
    }
  }

  return contexts;
};

const extractSearchSnippets = (html = "") => {
  const matches = [...html.matchAll(/<a[^>]+href="(https?:[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const snippets = [];
  for (const match of matches) {
    const url = match[1];
    const title = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!title || title.length < 3) {
      continue;
    }
    if (url.includes('duckduckgo.com')) {
      continue;
    }
    snippets.push({ url, summary: title });
    if (snippets.length >= 3) {
      break;
    }
  }
  return snippets;
};

const fetchSearchContext = async (message = "") => {
  const query = message.trim();
  if (!query) {
    return [];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(
      `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "NetfoodixAI/1.0" },
      }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    return extractSearchSnippets(html);
  } catch {
    return [];
  }
};

const fetchInstantAnswerContext = async (message = "") => {
  const query = message.trim();
  if (!query) {
    return [];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=0`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "NetfoodixAI/1.0" },
      }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const results = [];

    if (data?.AbstractText) {
      results.push({
        url: data?.AbstractURL || "https://duckduckgo.com",
        summary: data.AbstractText,
      });
    }

    if (Array.isArray(data?.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        const item = topic?.Text ? topic : topic?.Topics?.[0];
        if (!item?.Text) continue;
        results.push({
          url: item?.FirstURL || "https://duckduckgo.com",
          summary: item.Text,
        });
        if (results.length >= 3) break;
      }
    }

    return results.slice(0, 3);
  } catch {
    return [];
  }
};

const fetchGeoContext = async (message = "") => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&q=${encodeURIComponent(message)}`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "NetfoodixAI/1.0",
          Accept: "application/json",
        },
      }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      return [];
    }

    const places = await response.json();
    if (!Array.isArray(places) || !places.length) {
      return [];
    }

    return places.slice(0, 3).map((place) => ({
      url: place.osm_type && place.osm_id ? `https://www.openstreetmap.org/${place.osm_type}/${place.osm_id}` : "https://www.openstreetmap.org",
      summary: `Location match: ${place.display_name}. Coordinates: ${place.lat}, ${place.lon}`,
    }));
  } catch {
    return [];
  }
};

const fetchWikipediaContext = async (message = "") => {
  const query = message.trim();
  if (!query) {
    return [];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "NetfoodixAI/1.0" },
      }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const titles = data?.[1] || [];
    const descriptions = data?.[2] || [];
    const links = data?.[3] || [];

    const results = [];
    for (let i = 0; i < titles.length; i += 1) {
      if (!titles[i]) continue;
      results.push({
        url: links[i] || "https://en.wikipedia.org",
        summary: `${titles[i]}: ${descriptions[i] || "No summary snippet available."}`,
      });
      if (results.length >= 3) break;
    }

    return results;
  } catch {
    return [];
  }
};

const getExternalContext = async (message = "", { forceSearch = false } = {}) => {
  const urlContext = await fetchWebContext(message);
  if (urlContext.length) {
    return { mode: 'url', context: urlContext };
  }

  const searchIntent = /(where|location|address|near|nearest|find|price|menu|open|hours|which|what is)/i;
  if (!forceSearch && !searchIntent.test(message)) {
    return { mode: 'none', context: [] };
  }

  const geoContext = await fetchGeoContext(message);
  if (geoContext.length) {
    return { mode: 'geo', context: geoContext };
  }

  const instantContext = await fetchInstantAnswerContext(message);
  if (instantContext.length) {
    return { mode: 'instant', context: instantContext };
  }

  const searchContext = await fetchSearchContext(message);
  if (searchContext.length) {
    return { mode: 'search', context: searchContext };
  }

  const wikiContext = await fetchWikipediaContext(message);
  if (wikiContext.length) {
    return { mode: 'wiki', context: wikiContext };
  }

  return { mode: 'none', context: [] };
};

const tokenizeExpression = (expression) => {
  const tokens = [];
  let i = 0;

  while (i < expression.length) {
    const ch = expression[i];
    if (ch === " ") {
      i += 1;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let num = ch;
      i += 1;
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        num += expression[i];
        i += 1;
      }
      const value = Number(num);
      if (!Number.isFinite(value)) {
        return null;
      }
      tokens.push({ type: "number", value });
      continue;
    }

    if ("+-*/()".includes(ch)) {
      tokens.push({ type: "operator", value: ch });
      i += 1;
      continue;
    }

    return null;
  }

  return tokens;
};

const evaluateMathExpression = (rawExpression) => {
  if (!rawExpression) {
    return null;
  }

  const expression = rawExpression.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    return null;
  }

  const tokens = tokenizeExpression(expression);
  if (!tokens || !tokens.length) {
    return null;
  }

  const output = [];
  const operators = [];
  const precedence = { "+": 1, "-": 1, "*": 2, "/": 2 };

  for (let idx = 0; idx < tokens.length; idx += 1) {
    const token = tokens[idx];

    if (token.type === "number") {
      output.push(token.value);
      continue;
    }

    const op = token.value;
    if (op === "(") {
      operators.push(op);
      continue;
    }

    if (op === ")") {
      while (operators.length && operators[operators.length - 1] !== "(") {
        output.push(operators.pop());
      }
      if (!operators.length) {
        return null;
      }
      operators.pop();
      continue;
    }

    while (
      operators.length &&
      operators[operators.length - 1] !== "(" &&
      precedence[operators[operators.length - 1]] >= precedence[op]
    ) {
      output.push(operators.pop());
    }
    operators.push(op);
  }

  while (operators.length) {
    const op = operators.pop();
    if (op === "(") {
      return null;
    }
    output.push(op);
  }

  const stack = [];
  for (const token of output) {
    if (typeof token === "number") {
      stack.push(token);
      continue;
    }

    const b = stack.pop();
    const a = stack.pop();
    if (typeof a !== "number" || typeof b !== "number") {
      return null;
    }

    let value = 0;
    if (token === "+") value = a + b;
    if (token === "-") value = a - b;
    if (token === "*") value = a * b;
    if (token === "/") {
      if (b === 0) return null;
      value = a / b;
    }
    stack.push(value);
  }

  if (stack.length !== 1 || !Number.isFinite(stack[0])) {
    return null;
  }

  return stack[0];
};

const maybeCalculateBill = (message = "") => {
  const normalized = message.toLowerCase();
  if (!/(bill|subtotal|tip|tax|split|total)/i.test(normalized)) {
    return null;
  }

  const numberMatches = [...normalized.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
  if (!numberMatches.length) {
    return null;
  }

  const subtotalMatch = normalized.match(/(?:subtotal|bill|amount)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  const tipMatch = normalized.match(/tip\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%/i);
  const taxMatch = normalized.match(/tax\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%/i);
  const splitMatch = normalized.match(/(?:split\s*(?:among|by|for)?\s*|for\s*)(\d+)\s*(?:people|persons|friends)?/i);

  const subtotal = subtotalMatch ? Number(subtotalMatch[1]) : numberMatches[0];
  const tipPercent = tipMatch ? Number(tipMatch[1]) : 0;
  const taxPercent = taxMatch ? Number(taxMatch[1]) : 0;
  const splitBy = splitMatch ? Math.max(1, Number(splitMatch[1])) : 1;

  if (!Number.isFinite(subtotal)) {
    return null;
  }

  const tipAmount = subtotal * (tipPercent / 100);
  const taxAmount = subtotal * (taxPercent / 100);
  const total = subtotal + tipAmount + taxAmount;
  const each = total / splitBy;

  return [
    `Bill calculation:`,
    `- Subtotal: ${subtotal.toFixed(2)}`,
    `- Tip (${tipPercent}%): ${tipAmount.toFixed(2)}`,
    `- Tax (${taxPercent}%): ${taxAmount.toFixed(2)}`,
    `- Total: ${total.toFixed(2)}`,
    splitBy > 1 ? `- Split by ${splitBy}: ${each.toFixed(2)} each` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

const maybeCalculateMath = (message = "") => {
  const billResponse = maybeCalculateBill(message);
  if (billResponse) {
    return billResponse;
  }

  const expressionMatch = message.match(/(?:calculate|solve|math)\s*[:]?\s*([0-9+\-*/().%\s]+)/i);
  const candidate = expressionMatch?.[1] || message;

  if (!/[0-9]/.test(candidate) || !/[+\-*/%]/.test(candidate)) {
    return null;
  }

  const value = evaluateMathExpression(candidate);
  if (value === null) {
    return null;
  }

  return `Math result: ${value.toFixed(4).replace(/\.?0+$/, "")}`;
};

const buildSearchGuidance = (message = "") => {
  const query = message.trim() || "food ordering help";
  const encoded = encodeURIComponent(query);
  const whereIntent = /(where|location|address|near|nearest)/i.test(query);
  const whatIntent = /(what is|who is|define|meaning)/i.test(query);

  const lines = [
    `I couldn't fetch reliable live sources right now for: "${query}".`,
    'You can open these trusted search links immediately:',
    `- DuckDuckGo: https://duckduckgo.com/?q=${encoded}`,
    `- Google: https://www.google.com/search?q=${encoded}`,
    `- Wikipedia search: https://en.wikipedia.org/wiki/Special:Search?search=${encoded}`,
  ];

  if (whereIntent) {
    lines.push(`- OpenStreetMap: https://www.openstreetmap.org/search?query=${encoded}`);
  }

  if (whatIntent) {
    lines.push('If you want, paste one result URL here and I will summarize it for you.');
  }

  lines.push('I can still calculate bills/math right now (example: "Bill 200 tip 10% tax 8% split 4 people").');
  return lines.join('\n');
};

const db = new DatabaseSync("./netfoodix-ai.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
`);

const statements = {
  findUserByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
  findUserById: db.prepare("SELECT id, email FROM users WHERE id = ?"),
  createUser: db.prepare(
    "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)"
  ),
  createSession: db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)"),
  findSession: db.prepare("SELECT token, user_id as userId FROM sessions WHERE token = ?"),
  deleteSession: db.prepare("DELETE FROM sessions WHERE token = ?"),

  getConversation: db.prepare(
    "SELECT id FROM conversations WHERE id = ? AND user_id = ?"
  ),
  insertConversation: db.prepare(
    "INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)"
  ),
  listConversations: db.prepare(`
    SELECT id, user_id as userId, title, created_at as createdAt, updated_at as updatedAt
    FROM conversations
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `),
  listMessages: db.prepare(`
    SELECT id, role, content, created_at as createdAt
    FROM messages
    WHERE conversation_id = ?
    ORDER BY id ASC
  `),
  insertMessage: db.prepare(
    "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)"
  ),
  touchConversation: db.prepare(
    "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ),
  loadRecentMessages: db.prepare(`
    SELECT role, content
    FROM messages
    WHERE conversation_id = ?
    ORDER BY id DESC
    LIMIT 20
  `),
};

app.use(express.json({ limit: "1mb" }));
app.use(express.static("."));

const hashPassword = (password) => {
  const salt = randomUUID();
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  const [salt, hash] = stored.split(":");
  const compare = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(hash, "hex");
  return timingSafeEqual(compare, storedBuffer);
};

const getTokenFromAuthHeader = (authorization = "") => {
  if (!authorization.startsWith("Bearer ")) return "";
  return authorization.slice(7);
};

const requireAuth = (req, res, next) => {
  const token = getTokenFromAuthHeader(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Login required." });
  }

  const session = statements.findSession.get(token);
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }

  const user = statements.findUserById.get(session.userId);
  if (!user) {
    return res.status(401).json({ error: "User not found." });
  }

  req.user = user;
  req.sessionToken = token;
  next();
};

const ensureConversation = (userId, conversationId, firstMessage = "") => {
  let id = conversationId;
  if (id) {
    const existing = statements.getConversation.get(id, userId);
    if (existing) return id;
  }
  id = randomUUID();
  statements.insertConversation.run(id, userId, firstMessage.slice(0, 80) || "Netfoodix chat");
  return id;
};

app.post("/api/auth/signup", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: "Valid email and 6+ char password required." });
  }

  if (statements.findUserByEmail.get(email)) {
    return res.status(409).json({ error: "Email already registered." });
  }

  const userId = randomUUID();
  const passwordHash = hashPassword(password);
  statements.createUser.run(userId, email.toLowerCase(), passwordHash);

  const token = randomUUID();
  statements.createSession.run(token, userId);
  res.status(201).json({ token, user: { id: userId, email: email.toLowerCase() } });
});

app.post("/api/auth/signin", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = statements.findUserByEmail.get(email.toLowerCase());
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = randomUUID();
  statements.createSession.run(token, user.id);
  res.json({ token, user: { id: user.id, email: user.email } });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  statements.deleteSession.run(req.sessionToken);
  res.json({ ok: true });
});

app.get("/api/conversations/:userId", requireAuth, (req, res) => {
  if (req.params.userId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden." });
  }
  try {
    const rows = statements.listConversations.all(req.user.id);
    res.json({ conversations: rows });
  } catch {
    res.status(500).json({ error: "Failed to load conversations." });
  }
});

app.get("/api/messages/:conversationId", requireAuth, (req, res) => {
  const conversation = statements.getConversation.get(req.params.conversationId, req.user.id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found." });
  }
  res.json({ messages: statements.listMessages.all(req.params.conversationId) });
});

app.post("/api/conversations", requireAuth, (req, res) => {
  const { title = "New conversation" } = req.body || {};
  const conversationId = randomUUID();
  statements.insertConversation.run(conversationId, req.user.id, title);
  res.status(201).json({ conversationId });
});

app.post('/api/chat/stream', requireAuth, async (req, res) => {
  const { conversationId, message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const activeConversationId = ensureConversation(req.user.id, conversationId, message);
  statements.insertMessage.run(activeConversationId, 'user', message);
  statements.touchConversation.run(activeConversationId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const finishWithReply = (replyText) => {
    const reply = replyText || 'No response generated.';
    for (const chunk of chunkText(reply)) {
      res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
    }
    statements.insertMessage.run(activeConversationId, 'assistant', reply);
    statements.touchConversation.run(activeConversationId);
    res.write(`data: ${JSON.stringify({ done: true, conversationId: activeConversationId })}\n\n`);
    res.end();
  };

  const mathReply = maybeCalculateMath(message);
  if (mathReply) {
    finishWithReply(mathReply);
    return;
  }

  const external = await getExternalContext(message, { forceSearch: true });
  const contextLabel =
    external.mode === 'url'
      ? 'webpages you shared'
      : external.mode === 'geo'
        ? 'map location results'
        : external.mode === 'wiki'
          ? 'wikipedia results'
          : external.mode === 'instant'
            ? 'instant web answers'
            : 'web search results';

  if (external.context.length && !client) {
    const quickSummary = [
      `I checked ${contextLabel}:`,
      ...external.context.map((item, index) => `${index + 1}. ${item.url}\n${item.summary.slice(0, 450)}`),
      'Tip: ask a follow-up like "summarize key ordering details" or "compare delivery options" for better help.',
    ].join('\n\n');
    finishWithReply(quickSummary);
    return;
  }

  if (!client) {
    finishWithReply(buildSearchGuidance(message));
    return;
  }

  const history = statements.loadRecentMessages.all(activeConversationId);
  const inputHistory = history.reverse().map((item) => ({
    role: item.role === 'assistant' ? 'assistant' : 'user',
    content: item.content,
  }));

  const contextNote = external.context.length
    ? `\n\nWeb context from ${contextLabel}:\n${external.context
        .map((item, index) => `${index + 1}. ${item.url}\n${item.summary.slice(0, 700)}`)
        .join('\n\n')}`
    : '';

  let fullReply = '';
  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            `${systemPrompt} You can solve arithmetic precisely for bills, totals, taxes, tips, and splits. ` +
            `When web context is present, cite the URL and clearly separate facts from assumptions.` +
            contextNote,
        },
        ...inputHistory,
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (delta) {
        fullReply += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    statements.insertMessage.run(activeConversationId, 'assistant', fullReply || 'No response generated.');
    statements.touchConversation.run(activeConversationId);
    res.write(`data: ${JSON.stringify({ done: true, conversationId: activeConversationId })}\n\n`);
    res.end();
  } catch {
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate a streamed response.' })}\n\n`);
    res.end();
  }
});

app.post('/api/demo/chat/stream', async (req, res) => {
  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const streamReply = (textReply) => {
    const reply = textReply || 'No response generated.';
    for (const chunk of chunkText(reply)) {
      res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  };

  const mathReply = maybeCalculateMath(message);
  if (mathReply) {
    streamReply(mathReply);
    return;
  }

  const external = await getExternalContext(message, { forceSearch: true });
  if (external.context.length) {
    const contextLabel =
      external.mode === 'url'
        ? 'webpages you shared'
        : external.mode === 'geo'
          ? 'map location results'
          : external.mode === 'wiki'
            ? 'wikipedia results'
            : external.mode === 'instant'
              ? 'instant web answers'
              : 'web search results';
    const summary = [
      `I checked ${contextLabel}:`,
      ...external.context.map((item, index) => `${index + 1}. ${item.url}\n${item.summary.slice(0, 450)}`),
      'If you want, ask me to compare these sources or extract ordering details.',
    ].join('\n\n');
    streamReply(summary);
    return;
  }

  if (!client) {
    streamReply(buildSearchGuidance(message));
    return;
  }

  let fullReply = '';
  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            `${systemPrompt} You can browse by using provided URL context and also answer general food-ordering help questions.`,
        },
        { role: 'user', content: message },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (delta) {
        fullReply += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch {
    res.write(`data: ${JSON.stringify({ error: 'Demo chat failed.' })}\n\n`);
    res.end();
  }
});

app.post('/api/image', requireAuth, async (req, res) => {
  const { conversationId, prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }
  if (!client) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY in environment.' });
  }

  try {
    const image = await client.images.generate({ model: 'gpt-image-1', prompt, size: '1024x1024' });
    const base64 = image.data?.[0]?.b64_json;
    if (!base64) {
      return res.status(500).json({ error: 'No image returned.' });
    }

    const activeConversationId = ensureConversation(req.user.id, conversationId, prompt);
    statements.insertMessage.run(activeConversationId, 'user', `Image request: ${prompt}`);
    statements.insertMessage.run(activeConversationId, 'assistant', 'Generated an image for your prompt.');
    statements.touchConversation.run(activeConversationId);

    res.json({ image: `data:image/png;base64,${base64}`, conversationId: activeConversationId });
  } catch {
    res.status(500).json({ error: 'Failed to generate an image.' });
  }
});

app.listen(port, () => {
  console.log(`Netfoodix AI server running at http://localhost:${port}`);
});
