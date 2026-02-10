import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));

// ✅ Replace "*" with your real domain later (security)
app.use(cors({ origin: "*" }));

// ✅ Basic rate limiting to control spam/cost
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
  })
);

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

// ---- Simple in-memory sessions (works locally). For production use Redis/DB. ----
const sessions = new Map();
function getHistory(sessionId) {
  if (!sessions.has(sessionId)) sessions.set(sessionId, []);
  return sessions.get(sessionId);
}
function pushHistory(sessionId, role, content) {
  const h = getHistory(sessionId);
  h.push({ role, content });
  // keep last 20 messages to control cost
  if (h.length > 20) h.splice(0, h.length - 20);
}

app.get("/ping", (req, res) => res.send("pong"));

/**
 * POST /chat
 * Body: { message: string, sessionId?: string }
 * Returns: { reply: string }
 */
app.post("/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    const sessionId = String(req.body?.sessionId || "default");

    if (!message) return res.status(400).json({ error: "Message is empty" });

    const system = `
You are Netfoodix AI Companion (food ordering assistant).
- Detect the user's language and reply in the SAME language.
- Be human-like, friendly, and helpful.
- If asked about ordering: give clear steps.
- If asked something outside Netfoodix: still help as best as you can.
- If you need missing info: ask 1 short follow-up question.
`.trim();

    // load memory
    const history = getHistory(sessionId);

    const response = await client.responses.create({
      model: MODEL,
      input: [
        { role: "system", content: system },
        ...history,
        { role: "user", content: message },
      ],
    });

    const reply = response.output_text || "Sorry, I couldn't reply.";
    pushHistory(sessionId, "user", message);
    pushHistory(sessionId, "assistant", reply);

    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /chat-stream  (ChatGPT typing effect)
 * Body: { message: string, sessionId?: string }
 * Response: Server-Sent Events (SSE)
 */
app.post("/chat-stream", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    const sessionId = String(req.body?.sessionId || "default");
    if (!message) return res.status(400).end("Message is empty");

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const system = `
You are Netfoodix AI Companion.
Reply in the user's language. Be friendly and natural.
`.trim();

    const history = getHistory(sessionId);

    // Stream tokens as they arrive
    const stream = await client.responses.stream({
      model: MODEL,
      input: [
        { role: "system", content: system },
        ...history,
        { role: "user", content: message },
      ],
    });

    let finalText = "";

    stream.on("response.output_text.delta", (event) => {
      const chunk = event.delta || "";
      finalText += chunk;
      res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
    });

    stream.on("response.completed", () => {
      pushHistory(sessionId, "user", message);
      pushHistory(sessionId, "assistant", finalText);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });

    stream.on("error", (err) => {
      console.error(err);
      res.write(`data: ${JSON.stringify({ error: "stream error" })}\n\n`);
      res.end();
    });
  } catch (e) {
    console.error(e);
    res.status(500).end("Server error");
  }
});

/**
 * POST /image  (text → image)
 * Body: { prompt: string, size?: "1024x1024"|"1024x1536"|"1536x1024" }
 * Returns: { imageBase64: string }
 */
app.post("/image", async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();
    const size = String(req.body?.size || "1024x1024").trim();

    if (!prompt) return res.status(400).json({ error: "Prompt is empty" });

    const img = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size,
    });

    const imageBase64 = img.data?.[0]?.b64_json;
    if (!imageBase64) return res.status(500).json({ error: "No image returned" });

    res.json({ imageBase64 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Image generation failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Netfoodix AI API running at http://localhost:${PORT}`));
