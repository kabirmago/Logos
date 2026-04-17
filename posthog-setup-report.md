<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Logos, a React + Vite + TypeScript frontend with an Express/Node.js backend.

**Frontend** (`posthog-js` + `@posthog/react`): Initialized at app root in `src/main.tsx` with `PostHogProvider`. Users are identified on login and registration using their Firebase UID as the distinct ID, and `posthog.reset()` is called on logout. Events are captured across authentication, debate analysis, voice recording, and profile management flows.

**Backend** (`posthog-node`): A PostHog Node.js client is initialized in `server.ts`. Server-side events are captured for completed text and voice analysis API calls. The frontend passes the PostHog client-side `distinct_id` via an `X-POSTHOG-DISTINCT-ID` request header, enabling backend events to be correlated with frontend session data.

**Error tracking**: `posthog.captureException()` is called in all catch blocks across analysis and publish flows, on both frontend and backend.

**LLM Analytics** (`@posthog/ai`): The `GoogleGenAI` import in `server.ts` has been replaced with PostHog's instrumented wrapper from `@posthog/ai`. This automatically captures `$ai_generation` events for every Gemini call, recording model name, input/output tokens, latency, estimated cost, and the prompt/response (redacted in privacy mode). The `posthogDistinctId` and a `feature` property are forwarded on every generation so LLM traces can be correlated with the user who triggered them. All three API routes are instrumented: text analysis, real-time voice analysis, and full voice analysis.

**TypeScript fix**: Added `"vite/client"` to `tsconfig.json` types to resolve pre-existing `import.meta.env` errors.

## Events Instrumented

| Event Name | Description | File |
|---|---|---|
| `user_registered` | User successfully creates a new account | `src/context/AuthContext.tsx` |
| `user_logged_in` | User successfully logs into their account | `src/context/AuthContext.tsx` |
| `user_logged_out` | User logs out of their account | `src/context/AuthContext.tsx` |
| `debate_analysis_started` | User submits text debate for analysis | `src/context/DiscourseContext.tsx` |
| `debate_analysis_completed` | Text debate analysis returned results with scores | `src/context/DiscourseContext.tsx` |
| `debate_published_to_leaderboard` | User publishes an analyzed debate to the public leaderboard | `src/context/DiscourseContext.tsx` |
| `voice_recording_started` | User starts a voice recording session | `src/context/DiscourseContext.tsx` |
| `voice_recording_stopped` | User stops a voice recording session | `src/context/DiscourseContext.tsx` |
| `voice_analysis_completed` | Voice debate analysis returned results with speaker diarization | `src/context/DiscourseContext.tsx` |
| `profile_bio_updated` | User saves an updated bio on their profile | `src/components/Profile.tsx` |
| `recording_deleted` | User deletes a private recording from their archive | `src/components/Profile.tsx` |
| `leaderboard_debate_deleted` | User removes one of their debates from the public leaderboard | `src/components/Profile.tsx` |
| `api_text_analysis_completed` | Server-side: Gemini text analysis API request succeeded | `server.ts` |
| `api_voice_analysis_completed` | Server-side: Gemini voice analysis API request succeeded | `server.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics](https://us.posthog.com/project/385586/dashboard/1477942)
- **Insight**: [User Registration & Login Funnel](https://us.posthog.com/project/385586/insights/hcUjTDtd) — Conversion from sign-up → analysis → publish
- **Insight**: [Daily Active Users (Analyses Run)](https://us.posthog.com/project/385586/insights/kh57fz56) — DAU trend for text and voice analysis
- **Insight**: [Debate Publish Rate](https://us.posthog.com/project/385586/insights/qbfYHsZk) — Analyses completed vs. published to leaderboard
- **Insight**: [New User Signups Over Time](https://us.posthog.com/project/385586/insights/rjNyOqzX) — Weekly registration growth
- **Insight**: [User Retention (Analysis Feature)](https://us.posthog.com/project/385586/insights/XLHsMpjp) — Weekly retention for users who ran an analysis

## LLM Analytics

Every Gemini call now automatically sends a `$ai_generation` event to PostHog via `@posthog/ai`. You can explore these under **LLM Analytics** in your PostHog project:

- [LLM Generations](https://us.posthog.com/llm-analytics/generations) — Token usage, latency, and cost per Gemini call
- [LLM Traces](https://us.posthog.com/llm-analytics/traces) — Full trace view linking generations to users and features

Three Gemini features are instrumented, each tagged with a `feature` property:

| Feature tag | Route | Description |
|---|---|---|
| `text_analysis` | `POST /api/analyze` | Full debate text analysis |
| `realtime_analysis` | `POST /api/analyze-realtime` | Live conversation tone scoring |
| `voice_analysis` | `POST /api/analyze-voice` | Full voice debate diarization & scoring |

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
