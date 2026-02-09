import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

const systemPrompt =
  "You are Netfoodix AI, a friendly assistant for a food ordering app. Be concise, helpful, and practical.";
app.use(express.json({ limit: "1mb" }));
app.use(express.static("."));

app.post("/api/chat", async (req, res) => {
  if (!client) {
    return res
      .status(500)
      .json({ error: "Missing OPENAI_API_KEY in environment." });
  }
  const { message, history = [] } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }
  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
    });

    res.json({ reply: response.output_text?.trim() || "" });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate a response." });
  }
});
app.post("/api/image", async (req, res) => {
  if (!client) {
    return res
      .status(500)
      .json({ error: "Missing OPENAI_API_KEY in environment." });
  }
  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
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
    res.json({ image: `data:image/png;base64,${base64}` });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate an image." });
  }
});

app.listen(port, () => {
  console.log(`Netfoodix AI server running at http://localhost:${port}`);
});
