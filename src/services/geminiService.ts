import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ArgumentNode {
  id: string;
  type: 'claim' | 'evidence' | 'rebuttal' | 'concession';
  text: string;
  author: string;
  parentId?: string;
  reasoningScore: number; // 0-100
  vibe: number; // 0-100 (0: Toxic/Hostile, 100: Constructive/Civil)
  fallacies: string[];
  feedback: string; // One-sentence feedback
}

export interface DebateAnalysis {
  summary: string;
  nodes?: ArgumentNode[];
  overallScores?: {
    toxicity: number;
    constructiveness: number;
    persuasiveness: number;
  };
  trajectoryInsight?: string; // e.g., "Redemption Arc", "Entropy Slope"
  bestArguments?: string[];
  speakers?: {
    name: string;
    contribution: string;
    tone: string;
  }[];
  fallacies?: string[];
  title?: string;
}

export async function analyzeDebate(text: string): Promise<DebateAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze the following debate text. Identify the structure of arguments (claims, evidence, rebuttals), detect logical fallacies, score the quality of reasoning, and provide a one-sentence constructive feedback for each argument.
    
    Also, for each argument, assign a 'vibe' score from 0 to 100, where 0 is extremely toxic, hostile, or aggressive, and 100 is extremely constructive, civil, and respectful.
    
    Finally, provide a 'trajectoryInsight' summarizing the emotional flow of the debate (e.g., "Redemption Arc" if it started toxic but became civil, "Entropy Slope" if it started civil but collapsed into insults, or "Steady Progress").
    
    Debate Text:
    ${text}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "A concise summary of the debate" },
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['claim', 'evidence', 'rebuttal', 'concession'] },
                text: { type: Type.STRING },
                author: { type: Type.STRING },
                parentId: { type: Type.STRING, description: "ID of the argument this node responds to" },
                reasoningScore: { type: Type.NUMBER, description: "Score from 0 to 100" },
                vibe: { type: Type.NUMBER, description: "Emotional temperature from 0 (toxic) to 100 (civil)" },
                fallacies: { type: Type.ARRAY, items: { type: Type.STRING } },
                feedback: { type: Type.STRING, description: "A one-sentence constructive feedback for this specific argument" }
              },
              required: ['id', 'type', 'text', 'author', 'reasoningScore', 'vibe', 'fallacies', 'feedback']
            }
          },
          overallScores: {
            type: Type.OBJECT,
            properties: {
              toxicity: { type: Type.NUMBER },
              constructiveness: { type: Type.NUMBER },
              persuasiveness: { type: Type.NUMBER }
            },
            required: ['toxicity', 'constructiveness', 'persuasiveness']
          },
          trajectoryInsight: { type: Type.STRING, description: "A short label for the emotional flow of the debate" },
          bestArguments: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "IDs of the top 3 arguments based on reasoning quality"
          }
        },
        required: ['summary', 'nodes', 'overallScores', 'trajectoryInsight', 'bestArguments']
      }
    }
  });

  return JSON.parse(response.text);
}
