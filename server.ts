import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "crypto";

async function startServer() {
  const app = express();

  // Generate a fresh nonce per request for inline scripts (if any)
  app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString("base64");
    next();
  });

  app.use((req, res, next) => {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: [
            "'self'",
            "https://*.googleapis.com",
            "https://*.firebaseapp.com",
            "https://*.firebase.com",
            "https://*.firebaseio.com",
            "https://identitytoolkit.googleapis.com",
            "https://securetoken.googleapis.com",
            "https://logosapp.me",
          ],
          // Removed 'unsafe-inline' and 'unsafe-eval' — not needed in prod Vite build
          scriptSrc: [
            "'self'",
            `'nonce-${res.locals.nonce}'`,
          ],
          styleSrc: ["'self'", "'unsafe-inline'"], // inline styles are lower risk, needed for React
          imgSrc: ["'self'", "data:", "blob:"],
          fontSrc: ["'self'", "data:"],
          mediaSrc: ["'self'", "blob:"],
          workerSrc: ["'self'", "blob:"],
          objectSrc: ["'none'"],              // block Flash/plugins entirely
          baseUri: ["'self'"],               // prevent base tag injection
          frameAncestors: ["'none'"],        // prevent clickjacking (replaces X-Frame-Options)
          upgradeInsecureRequests: [],       // auto-upgrade http → https
        },
      },
      // HSTS: 1 year + preload (submit to hstspreload.org for A+)
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })(req, res, next);
  });
  app.use(express.json({ limit: "1mb" }));
  const PORT = 3000;

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const analyzeLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
  const realtimeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });

  app.post("/api/analyze", analyzeLimiter, async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "No text provided" });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: `Analyze the following debate text. Identify the structure of arguments (claims, evidence, rebuttals), detect logical fallacies, score the quality of reasoning, and provide a one-sentence constructive feedback for each argument.

For each argument, assign a 'vibe' score from 0 to 100, where 0 is extremely toxic/hostile and 100 is extremely constructive/civil.

For 'trajectoryInsight': provide a SHORT label of exactly 2-4 words describing the emotional arc (e.g., "Steady Progress", "Entropy Slope", "Redemption Arc", "Toxic Spiral", "Civil Exchange"). NEVER write a full sentence - maximum 4 words.

For 'bestArguments': REQUIRED - always return an array of exactly the top 3 argument node IDs that have the highest reasoningScore. Never return an empty array.

Return ONLY valid JSON: { summary, nodes: [{id, type, text, author, parentId, reasoningScore, vibe, fallacies, feedback}], overallScores: {toxicity, constructiveness, persuasiveness}, trajectoryInsight, bestArguments }

Debate Text:
${text}`,
      });

      const raw = response.text.replace(/```json|```/g, "").trim();
      res.json(JSON.parse(raw));
    } catch (e: any) {
      console.error("Gemini error:", e.message);
      res.status(500).json({ error: "Analysis failed. Please try again." });
    }
  });

  app.post("/api/analyze-realtime", realtimeLimiter, async (req, res) => {
    try {
      const { audio, mimeType } = req.body;
      if (!audio) return res.status(400).json({ error: "No audio provided" });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [{
          parts: [
            { inlineData: { data: audio, mimeType: mimeType || 'audio/webm' } },
            { text: "Analyze the current state of this conversation. Return a JSON object with 'status' (one of 'green', 'yellow', 'red') and 'reason' (max 10 words). Green means constructive, yellow means heated or repetitive, red means aggressive or fallacious." }
          ]
        }],
        config: { responseMimeType: "application/json" }
      });

      const raw = response.text.replace(/```json|```/g, "").trim();
      res.json(JSON.parse(raw));
    } catch (e: any) {
      console.error("Realtime analysis error:", e.message);
      res.status(500).json({ error: "Realtime analysis failed. Please try again." });
    }
  });

  app.post("/api/analyze-voice", analyzeLimiter, async (req, res) => {
    try {
      const { audio, mimeType } = req.body;
      if (!audio) return res.status(400).json({ error: "No audio provided" });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [{
          parts: [
            { inlineData: { data: audio, mimeType: mimeType || 'audio/webm' } },
            { text: `Perform a deep analysis of this debate/conversation.
1. Identify when speakers switch and name them (e.g. Speaker A, Speaker B or their names if mentioned).
2. Score persuasiveness (0-100) and constructiveness (0-100).
3. Detect logical fallacies.
4. Provide a summary.

Return ONLY valid JSON:
{
  "title": "Short descriptive title",
  "score": number,
  "constructiveness": number,
  "fallacies": ["fallacy name", ...],
  "summary": "string",
  "speakers": [{ "name": "string", "contribution": "summary of their points", "tone": "string" }]
}` }
          ]
        }],
        config: { responseMimeType: "application/json" }
      });

      const raw = response.text.replace(/```json|```/g, "").trim();
      res.json(JSON.parse(raw));
    } catch (e: any) {
      console.error("Voice analysis error:", e.message);
      res.status(500).json({ error: "Voice analysis failed. Please try again." });
    }
  });

  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
