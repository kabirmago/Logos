import express from "express";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import session from "express-session";
import bcrypt from "bcryptjs";
import { GoogleGenAI } from "@google/genai";

let db: any;

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Initializing database...");
  try {
    db = await open({
      filename: "debates.db",
      driver: sqlite3.Database
    });
    console.log("Database initialized.");

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        bio TEXT,
        role TEXT DEFAULT 'user',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leaderboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        title TEXT,
        score REAL,
        constructiveness REAL,
        analysis TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS private_recordings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        title TEXT,
        type TEXT, -- 'text' or 'voice'
        rawData TEXT,
        analysis TEXT,
        score REAL,
        constructiveness REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
      );
    `);
    console.log("Database schema verified.");

    // Seed KabirMago as admin if not exists
    const existingAdmin = await db.get("SELECT id FROM users WHERE username = 'KabirMago'");
    if (!existingAdmin) {
      const hashedPassword = bcrypt.hashSync("logos2026", 10);
      await db.run("INSERT INTO users (username, password, bio, role) VALUES (?, ?, ?, ?)", "KabirMago", hashedPassword, "Admin", "admin");
      console.log("KabirMago admin user created.");
    }
  } catch (err) {
    console.error("CRITICAL: Database failure:", err);
  }

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use(express.json());
  app.use(session({
    secret: "logos-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Middleware to check admin - accepts x-admin-username header from Firebase-authed frontend
  const isAdmin = async (req: any, res: any, next: any) => {
    const username = req.headers['x-admin-username'];
    if (!username) return res.status(401).json({ error: "Unauthorized" });
    const user: any = await db.get("SELECT role FROM users WHERE username = ?", username);
    if (user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    next();
  };

  // Gemini Analyze Route
  app.post("/api/analyze", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "No text provided" });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
      res.status(500).json({ error: e.message });
    }
  });

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.run("INSERT INTO users (username, password, bio) VALUES (?, ?, ?)", username, hashedPassword, "");
      (req.session as any).userId = result.lastID;
      res.json({ id: result.lastID, username, role: 'user' });
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "Username already exists" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user: any = await db.get("SELECT * FROM users WHERE username = ?", username);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    (req.session as any).userId = user.id;
    res.json({ id: user.id, username: user.username, bio: user.bio, role: user.role });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    const user: any = await db.get("SELECT id, username, bio, role FROM users WHERE id = ?", userId);
    res.json(user);
  });

  // Admin Routes
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    const totalUsers = await db.get("SELECT COUNT(*) as count FROM users");
    const totalDebates = await db.get("SELECT COUNT(*) as count FROM leaderboard");
    const avgScore = await db.get("SELECT AVG(score) as avg FROM leaderboard");
    const avgConstructiveness = await db.get("SELECT AVG(constructiveness) as avg FROM leaderboard");
    
    const recentActivity = await db.all(`
      SELECT l.title, u.username, l.timestamp 
      FROM leaderboard l 
      JOIN users u ON l.userId = u.id 
      ORDER BY l.timestamp DESC 
      LIMIT 5
    `);

    res.json({
      totalUsers: totalUsers.count,
      totalDebates: totalDebates.count,
      avgScore: Math.round(avgScore.avg || 0),
      avgConstructiveness: Math.round(avgConstructiveness.avg || 0),
      recentActivity
    });
  });

  app.patch("/api/auth/profile", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    const { bio } = req.body;
    await db.run("UPDATE users SET bio = ? WHERE id = ?", bio, userId);
    res.json({ success: true });
  });

  // Leaderboard Routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const rows = await db.all(`
        SELECT l.*, u.username as author 
        FROM leaderboard l 
        JOIN users u ON l.userId = u.id 
        ORDER BY l.score DESC 
        LIMIT 50
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/leaderboard/:id", async (req, res) => {
    const row: any = await db.get("SELECT * FROM leaderboard WHERE id = ?", req.params.id);
    if (!row) return res.status(404).json({ error: "Debate not found" });
    res.json({ ...row, analysis: JSON.parse(row.analysis) });
  });

  app.post("/api/leaderboard", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Log in to publish" });

    try {
      const { title, score, constructiveness, analysis } = req.body;
      const result = await db.run("INSERT INTO leaderboard (userId, title, score, constructiveness, analysis) VALUES (?, ?, ?, ?, ?)",
        userId, title, score, constructiveness, JSON.stringify(analysis));
      res.json({ id: result.lastID });
    } catch (err) {
      res.status(500).json({ error: "Failed to save" });
    }
  });

  app.delete("/api/leaderboard/:id", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });

    const debate: any = await db.get("SELECT userId FROM leaderboard WHERE id = ?", req.params.id);
    if (!debate) return res.status(404).json({ error: "Not found" });
    if (debate.userId !== userId) return res.status(403).json({ error: "Not authorized" });

    await db.run("DELETE FROM leaderboard WHERE id = ?", req.params.id);
    res.json({ success: true });
  });

  app.get("/api/users/:username/debates", async (req, res) => {
    const user: any = await db.get("SELECT id FROM users WHERE username = ?", req.params.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    const rows = await db.all("SELECT id, title, score, timestamp FROM leaderboard WHERE userId = ? ORDER BY timestamp DESC", user.id);
    res.json(rows);
  });

  // Private Recordings Routes
  app.get("/api/my-recordings", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    const rows = await db.all("SELECT id, title, type, score, constructiveness, timestamp FROM private_recordings WHERE userId = ? ORDER BY timestamp DESC", userId);
    res.json(rows);
  });

  app.get("/api/my-recordings/:id", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    const row: any = await db.get("SELECT * FROM private_recordings WHERE id = ? AND userId = ?", req.params.id, userId);
    if (!row) return res.status(404).json({ error: "Recording not found" });
    res.json({ ...row, analysis: row.analysis ? JSON.parse(row.analysis) : null });
  });

  app.post("/api/my-recordings", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    const { title, type, rawData, analysis, score, constructiveness } = req.body;
    const result = await db.run(
      "INSERT INTO private_recordings (userId, title, type, rawData, analysis, score, constructiveness) VALUES (?, ?, ?, ?, ?, ?, ?)",
      userId, title, type, rawData, JSON.stringify(analysis), score, constructiveness
    );
    res.json({ id: result.lastID });
  });

  app.post("/api/my-recordings/:id/publish", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    
    const recording: any = await db.get("SELECT * FROM private_recordings WHERE id = ? AND userId = ?", req.params.id, userId);
    if (!recording) return res.status(404).json({ error: "Recording not found" });

    const result = await db.run(
      "INSERT INTO leaderboard (userId, title, score, constructiveness, analysis) VALUES (?, ?, ?, ?, ?)",
      userId, recording.title, recording.score, recording.constructiveness, recording.analysis
    );
    res.json({ id: result.lastID });
  });

  app.delete("/api/my-recordings/:id", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    await db.run("DELETE FROM private_recordings WHERE id = ? AND userId = ?", req.params.id, userId);
    res.json({ success: true });
  });

  // Admin - List all users
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    const users = await db.all("SELECT id, username, bio, role, timestamp FROM users ORDER BY timestamp DESC");
    res.json(users);
  });

  // Admin - Get user detail with their debates
  app.get("/api/admin/users/:username", isAdmin, async (req, res) => {
    const user = await db.get("SELECT id, username, bio, role, timestamp FROM users WHERE username = ?", req.params.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    const debates = await db.all("SELECT id, title, score, constructiveness, timestamp FROM leaderboard WHERE userId = ? ORDER BY timestamp DESC", user.id);
    res.json({ ...user, debates });
  });

  // Admin - Delete any leaderboard entry
  app.delete("/api/admin/leaderboard/:id", isAdmin, async (req, res) => {
    await db.run("DELETE FROM leaderboard WHERE id = ?", req.params.id);
    res.json({ success: true });
  });

  // API 404 handler
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware
  if (true) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
