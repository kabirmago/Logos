import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import fs from "fs";
import { clip, escapeHtml } from "./src/lib/ogText";

async function startServer() {
  const app = express();

  // Behind Railway's edge proxy in production: trust exactly one hop so
  // express-rate-limit reads the real client IP from X-Forwarded-For without
  // trusting a spoofable, fully-permissive proxy chain.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

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

  // Cap analyze input length: the endpoint is unauthenticated and every call
  // costs a Gemini request, so guard against oversized/abusive payloads before
  // spending money. ~50k chars is plenty for a long debate transcript.
  const MAX_ANALYZE_CHARS = 50_000;

  app.post("/api/analyze", analyzeLimiter, async (req, res) => {
    try {
      const { text } = req.body;
      if (typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "No text provided" });
      }
      if (text.length > MAX_ANALYZE_CHARS) {
        return res.status(413).json({
          error: `Text too long (${text.length.toLocaleString()} chars). Max is ${MAX_ANALYZE_CHARS.toLocaleString()}.`,
        });
      }

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

  // Fetch a shared analysis from Firestore (used by both the API and OG tag injection)
  async function fetchSharedAnalysis(id: string) {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const dbId = process.env.VITE_FIREBASE_FIRESTORE_DB_ID || '(default)';
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    if (!projectId || !apiKey) return null;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/sharedAnalyses/${encodeURIComponent(id)}?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    // Convert Firestore REST format to plain object
    function parseValue(v: any): any {
      if (v.stringValue !== undefined) return v.stringValue;
      if (v.integerValue !== undefined) return Number(v.integerValue);
      if (v.doubleValue !== undefined) return v.doubleValue;
      if (v.booleanValue !== undefined) return v.booleanValue;
      if (v.timestampValue !== undefined) return v.timestampValue;
      if (v.nullValue !== undefined) return null;
      if (v.arrayValue) return (v.arrayValue.values || []).map(parseValue);
      if (v.mapValue) {
        const obj: any = {};
        for (const [k, val] of Object.entries(v.mapValue.fields || {})) obj[k] = parseValue(val);
        return obj;
      }
      return null;
    }
    const fields = data.fields || {};
    const result: any = {};
    for (const [k, v] of Object.entries(fields)) result[k] = parseValue(v);
    return result;
  }

  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const analysis = await fetchSharedAnalysis(req.params.id);
      if (!analysis) return res.status(404).json({ error: "Analysis not found" });
      res.json(analysis);
    } catch (e: any) {
      console.error("Error fetching shared analysis:", e.message);
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static("dist"));

    // Inject OG meta tags for shared analysis links so crawlers see them
    app.get("/analysis/:id", async (req, res) => {
      try {
        const analysis = await fetchSharedAnalysis(req.params.id);
        const baseUrl = (process.env.APP_URL || 'https://logosapp.me').replace(/\/$/, '');
        const html = fs.readFileSync(path.resolve("dist/index.html"), "utf-8");

        // clip() truncates at a word boundary BEFORE escapeHtml() runs, so we
        // never slice an HTML entity in half and titles never cut mid-word.
        const summary = typeof analysis?.summary === 'string' ? analysis.summary.trim() : '';
        // ~48 chars of summary + the "Debate Analysis — " prefix keeps the whole title
        // under iMessage's 2-line limit so it stays complete across iMessage/Twitter/LinkedIn.
        const title = escapeHtml(
          summary ? `Debate Analysis — ${clip(summary, 48)}` : 'Logos — Reasoning Analyzer'
        );
        const description = escapeHtml(
          summary ? clip(summary, 180) : 'AI-powered debate analysis: argument structure, logical fallacies, and reasoning scores.'
        );
        const url = escapeHtml(`${baseUrl}/analysis/${req.params.id}`);
        const image = `${baseUrl}/og-image.png`;

        const ogTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Logos" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Logos — Reasoning Analyzer" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />`;

        // Strip the static <title> from the build, then inject our tags before </head>.
        const injected = html
          .replace(/<title>.*?<\/title>/i, '')
          .replace('</head>', `${ogTags}\n  </head>`);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(injected);
      } catch (e) {
        res.sendFile(path.resolve("dist/index.html"));
      }
    });

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
