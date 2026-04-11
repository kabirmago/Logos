<div align="center">

# Logos
### AI-Powered Debate Analysis

**[logos-production-1d63.up.railway.app](https://logos-production-1d63.up.railway.app/)**

*Paste a debate. Understand it.*

</div>

---

## What is Logos?

Logos is a full-stack web application that uses AI to analyze the structure, quality, and tone of arguments in real debates. Paste in a Reddit thread, a forum argument, or a transcript — Logos maps every claim, rebuttal, and piece of evidence into an interactive graph, scores the reasoning quality of each argument, detects logical fallacies, and tracks how the emotional tone escalates (or doesn't) over the course of the exchange.

It also supports live voice debates: record two people arguing in real-time and Logos performs speaker diarization, identifies who said what, and scores each participant's constructiveness and persuasiveness.

I built this because I'm part of a discourse and debate club and wanted a tool that gave structured, objective feedback on arguments — not just "you were wrong," but *why* and *how* the reasoning broke down.

---

## Features

- **Argument Graph** — Interactive D3 visualization mapping claims, evidence, rebuttals, and concessions as a node graph. Click any node to inspect it.
- **Reasoning Scores** — Each argument is scored 0–100 for reasoning quality and "vibe" (constructiveness vs. toxicity).
- **Fallacy Detection** — Automatically identifies named logical fallacies (ad hominem, straw man, false dichotomy, etc.) within each argument.
- **Escalation Trajectory** — Tracks how the emotional tone of a debate evolves over time, with a 2–4 word arc label (e.g. "Toxic Spiral", "Redemption Arc", "Civil Exchange").
- **Top Arguments** — Surfaces the three highest-scoring arguments in any debate.
- **Voice Debate Mode** — Record live audio, get full speaker diarization and per-speaker analysis.
- **Leaderboard** — Publish your best debate analyses publicly and compete on reasoning quality scores.
- **Private Recordings** — Save analyses privately to your profile.
- **Admin Dashboard** — Full user and content management.

--- 

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (via better-sqlite3) + Firebase Firestore |
| Auth | Firebase Authentication |
| AI | Google Gemini 3.1 Flash-Lite (via Gemini API) |
| Visualization | D3.js, Recharts, Framer Motion |
| Deployment | Railway |

---

## How It Works

1. **Paste** a debate transcript, Reddit thread, or any text with multiple speakers arguing a position
2. **Gemini** parses the full exchange, identifies individual arguments, maps their relationships (which claims are being rebutted, what evidence supports what), and scores each one
3. **Logos** renders the structure as an interactive node graph and surfaces key insights: top reasoning, fallacies detected, emotional arc
4. **Optionally publish** your analysis to the public leaderboard

For voice debates, Logos records audio directly in the browser, sends it to the backend, and Gemini performs diarization (speaker identification) and full analysis on the complete recording.

---

## Running Locally

**Prerequisites:** Node.js 18+, a Gemini API key (free at [aistudio.google.com](https://aistudio.google.com)), a Firebase project

```bash
git clone https://github.com/kabirmago/Logos
cd Logos
npm install
cp .env.example .env.local
# Fill in your keys in .env.local
npm run dev
```

---

## What I Learned

This project pushed me across the full stack in ways I hadn't experienced before. A few things that stood out:

- **Prompt engineering is its own discipline.** Getting Gemini to return consistent, parseable JSON with the exact schema I needed — especially for edge cases like very short debates or single-speaker monologues — took significant iteration.
- **Security isn't an afterthought.** Early versions had the Gemini API key exposed in the browser bundle and used a hardcoded session secret. Fixing this meant understanding the difference between server-side and client-side code, environment variables, and how Vite's `VITE_` prefix works.
- **D3 and React don't always play nicely.** Managing D3's imperative DOM manipulation inside React's declarative rendering model required careful use of refs and effect cleanup.
- **Deploying is different from running locally.** Railway, environment variables, production vs. development modes, Docker build caching — none of this is covered in tutorials.

---

## Roadmap

- [ ] Real-time multiplayer debate mode (two users debate live with WebSocket scoring)
- [ ] Shareable debate links with Open Graph previews
- [ ] Argument improvement suggestions ("here's how to make this rebuttal stronger")
- [ ] Export analysis as PDF

---

<div align="center">
Built by <a href="https://github.com/kabirmago">Kabir</a>
</div>
