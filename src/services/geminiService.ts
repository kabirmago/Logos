export interface ArgumentNode {
  id: string;
  type: 'claim' | 'evidence' | 'rebuttal' | 'concession';
  text: string;
  author: string;
  parentId?: string;
  reasoningScore: number;
  vibe: number;
  fallacies: string[];
  feedback: string;
}

export interface DebateAnalysis {
  summary: string;
  nodes?: ArgumentNode[];
  overallScores?: {
    toxicity: number;
    constructiveness: number;
    persuasiveness: number;
  };
  trajectoryInsight?: string;
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
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to analyze');
  }
  return response.json();
}
