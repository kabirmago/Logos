// A small dictionary of common logical fallacies so the UI can teach, not just
// flag. Gemini returns free-form fallacy names, so lookup normalizes and checks
// aliases before giving up and returning a generic entry.

export interface FallacyInfo {
  name: string;
  definition: string;
  counter: string; // how to respond to / avoid it
}

interface FallacyEntry extends FallacyInfo {
  aliases: string[];
}

const FALLACIES: FallacyEntry[] = [
  {
    name: 'Ad Hominem',
    aliases: ['ad hominem attack', 'personal attack', 'name calling'],
    definition: 'Attacking the person making an argument rather than the argument itself.',
    counter: 'Redirect to the claim: "Set aside who said it — is the point actually true?"',
  },
  {
    name: 'Straw Man',
    aliases: ['strawman', 'misrepresentation'],
    definition: "Misrepresenting someone's position to make it easier to attack.",
    counter: 'Restate your actual position and ask them to address that version.',
  },
  {
    name: 'False Dichotomy',
    aliases: ['false dilemma', 'black and white', 'either or', 'black-or-white'],
    definition: 'Presenting only two options when more exist.',
    counter: 'Name a third option to show the choice is not binary.',
  },
  {
    name: 'Slippery Slope',
    aliases: ['slippery-slope'],
    definition: 'Claiming one small step will inevitably lead to an extreme outcome.',
    counter: 'Ask for the evidence linking each step — inevitability rarely holds.',
  },
  {
    name: 'Appeal to Authority',
    aliases: ['argument from authority', 'appeal to authority figure'],
    definition: 'Treating a claim as true simply because an authority asserts it.',
    counter: 'Ask for the underlying evidence, not just the credential.',
  },
  {
    name: 'Appeal to Emotion',
    aliases: ['emotional appeal', 'appeal to fear', 'appeal to pity'],
    definition: 'Using feelings rather than reasoning to win the point.',
    counter: 'Acknowledge the feeling, then ask what evidence supports the claim.',
  },
  {
    name: 'Hasty Generalization',
    aliases: ['overgeneralization', 'sweeping generalization', 'anecdotal'],
    definition: 'Drawing a broad conclusion from too few examples.',
    counter: 'Ask about sample size and whether counter-examples exist.',
  },
  {
    name: 'Circular Reasoning',
    aliases: ['begging the question', 'circular argument', 'petitio principii'],
    definition: 'The conclusion is assumed within one of the premises.',
    counter: 'Ask for independent support that does not restate the conclusion.',
  },
  {
    name: 'Whataboutism',
    aliases: ['tu quoque', 'two wrongs', 'appeal to hypocrisy'],
    definition: 'Deflecting criticism by pointing to someone else’s faults.',
    counter: 'Note that another wrong does not resolve the original question.',
  },
  {
    name: 'Red Herring',
    aliases: ['distraction', 'irrelevant'],
    definition: 'Introducing an irrelevant point to divert the discussion.',
    counter: 'Name the diversion and steer back to the original claim.',
  },
  {
    name: 'False Cause',
    aliases: ['post hoc', 'correlation causation', 'post hoc ergo propter hoc', 'causal fallacy'],
    definition: 'Assuming that because B followed A, A caused B.',
    counter: 'Ask whether correlation could be coincidence or a shared cause.',
  },
  {
    name: 'Bandwagon',
    aliases: ['appeal to popularity', 'ad populum', 'appeal to the people'],
    definition: 'Claiming something is true because many people believe it.',
    counter: 'Popularity is not evidence — ask what actually makes it true.',
  },
  {
    name: 'No True Scotsman',
    aliases: ['no-true-scotsman', 'appeal to purity'],
    definition: 'Redefining a category to exclude a counter-example.',
    counter: 'Point out the definition was moved to dodge the example.',
  },
  {
    name: 'Equivocation',
    aliases: ['ambiguity', 'doublespeak'],
    definition: 'Using a word in two different senses to mislead.',
    counter: 'Pin down one definition and hold the argument to it.',
  },
  {
    name: 'Loaded Question',
    aliases: ['complex question', 'leading question'],
    definition: 'A question with an unjustified assumption built in.',
    counter: 'Reject the premise before answering the question.',
  },
  {
    name: 'Appeal to Ignorance',
    aliases: ['argument from ignorance', 'ad ignorantiam'],
    definition: 'Claiming something is true because it has not been proven false.',
    counter: 'The burden of proof is on the claim, not its absence.',
  },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Precompute a normalized lookup map (name + aliases -> entry).
const INDEX = new Map<string, FallacyEntry>();
for (const entry of FALLACIES) {
  INDEX.set(normalize(entry.name), entry);
  for (const alias of entry.aliases) INDEX.set(normalize(alias), entry);
}

/**
 * Look up explanatory info for a fallacy name returned by the model.
 * Falls back to a generic entry (using the raw name) when unknown, so the UI
 * always has something to show.
 */
export function lookupFallacy(raw: string): FallacyInfo {
  const key = normalize(raw);
  const exact = INDEX.get(key);
  if (exact) return { name: exact.name, definition: exact.definition, counter: exact.counter };

  // Fuzzy: does any known key appear within the provided name (or vice versa)?
  for (const [k, entry] of INDEX) {
    if (key.includes(k) || k.includes(key)) {
      return { name: entry.name, definition: entry.definition, counter: entry.counter };
    }
  }

  return {
    name: raw,
    definition: 'A flaw in reasoning that can make an argument misleading or invalid.',
    counter: 'Ask for the evidence and check whether the conclusion actually follows.',
  };
}
