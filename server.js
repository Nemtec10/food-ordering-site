import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

const systemPrompt =
  "You are Netfoodix AI, a friendly assistant for a food ordering app. Be concise, helpful, and practical.";

const db = new DatabaseSync("./netfoodix-ai.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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

const ensureConversation = (userId, conversationId, firstMessage = "") => {
  let id = conversationId;

  if (id) {
    const existing = statements.getConversation.get(id, userId);
    if (existing) {
      return id;
    }
  }

  id = randomUUID();
  const title = firstMessage.slice(0, 80) || "Netfoodix chat";
  statements.insertConversation.run(id, userId, title);
  return id;
};

app.get("/api/conversations/:userId", (req, res) => {
  try {
    const rows = statements.listConversations.all(req.params.userId);
    res.json({ conversations: rows });
  } catch {
    res.status(500).json({ error: "Failed to load conversations." });
  }
});

app.get("/api/messages/:conversationId", (req, res) => {
  try {
    const rows = statements.listMessages.all(req.params.conversationId);
    res.json({ messages: rows });
  } catch {
    res.status(500).json({ error: "Failed to load messages." });
  }
});

app.post("/api/conversations", (req, res) => {
  const { userId, title = "New conversation" } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: "userId is required." });
  }

  try {
    const conversationId = randomUUID();
    statements.insertConversation.run(conversationId, userId, title);
    res.status(201).json({ conversationId });
  } catch {
    res.status(500).json({ error: "Failed to create conversation." });
  }
});

app.post("/api/chat/stream", async (req, res) => {
  const { userId, conversationId, message } = req.body || {};

  if (!userId || !message) {
    return res.status(400).json({ error: "userId and message are required." });
  }

  const activeConversationId = ensureConversation(userId, conversationId, message);
  statements.insertMessage.run(activeConversationId, "user", message);
  statements.touchConversation.run(activeConversationId);

  if (!client) {
    return res.status(500).json({
      error: "Missing OPENAI_API_KEY in environment.",
      conversationId: activeConversationId,
    });
  }

  const history = statements.loadRecentMessages.all(activeConversationId);
  const inputHistory = history.reverse().map((item) => ({
    role: item.role === "assistant" ? "assistant" : "user",
    content: item.content,
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullReply = "";

  try {
    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...inputHistory],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) {
        fullReply += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    if (!fullReply.trim()) {
      fullReply = "I couldn't generate a reply this time. Please try again.";
      res.write(`data: ${JSON.stringify({ delta: fullReply })}\n\n`);
    }

    statements.insertMessage.run(activeConversationId, "assistant", fullReply);
    statements.touchConversation.run(activeConversationId);
    res.write(
      `data: ${JSON.stringify({ done: true, conversationId: activeConversationId })}\n\n`
    );
    res.end();
  } catch {
    res.write(
      `data: ${JSON.stringify({ error: "Failed to generate a streamed response." })}\n\n`
    );
    res.end();
  }
});

app.post("/api/image", async (req, res) => {
  const { userId, conversationId, prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  if (!client) {
    return res
      .status(500)
      .json({ error: "Missing OPENAI_API_KEY in environment." });
  }

  try {
    const image = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const base64 = image.data?.[0]?.b64_json;
    if (!base64) {
      return res.status(500).json({ error: "No image returned." });
    }

    let activeConversationId = conversationId;
    if (userId) {
      activeConversationId = ensureConversation(userId, conversationId, prompt);
      statements.insertMessage.run(
        activeConversationId,
        "user",
        `Image request: ${prompt}`
      );
      statements.insertMessage.run(
        activeConversationId,
        "assistant",
        "Generated an image for your prompt."
      );
      statements.touchConversation.run(activeConversationId);
    }

    res.json({
      image: `data:image/png;base64,${base64}`,
      conversationId: activeConversationId,
    });
  } catch {
    res.status(500).json({ error: "Failed to generate an image." });
  }
});

app.listen(port, () => {
  console.log(`Netfoodix AI server running at http://localhost:${port}`);
});
