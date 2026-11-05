import type { StructuredTask } from '../src/types.js';

const ACTION_PATTERN = /\b(?:will|should|needs?\s+to|need\s+to|must|has\s+to|have\s+to|plan(?:s|ned)?\s+to|responsible\s+for|assigned\s+to|agreed\s+to|next\s+step\s+is|make\s+sure|let['’]s|i['’]ll|we['’]ll|someone\s+(?:needs|has)\s+to|please|review|send|finish|complete|prepare|update|fix|test|deliver|create|implement|schedule|document|email|call|transfer|wire)\b/i;
const NON_ACTION_PATTERN = /^(?:what if|maybe we should|we discussed|did we|has been completed|that is completed|i think)\b/i;

function splitSentences(transcript: string): string[] {
  return transcript
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 5);
}

export function extractActionCandidates(transcript: string): string[] {
  return splitSentences(transcript).filter(sentence =>
    ACTION_PATTERN.test(sentence) && !NON_ACTION_PATTERN.test(sentence),
  );
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function tokenOverlap(left: string, right: string): number {
  const leftTokens = new Set(normalize(left).split(/\s+/).filter(token => token.length > 2));
  const rightTokens = new Set(normalize(right).split(/\s+/).filter(token => token.length > 2));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  return [...leftTokens].filter(token => rightTokens.has(token)).length / leftTokens.size;
}

function isExplicitlySupported(value: string, evidence: string): boolean {
  const normalizedValue = normalize(value);
  return normalizedValue.length > 0
    && normalizedValue !== 'not specified'
    && (normalize(evidence).includes(normalizedValue) || tokenOverlap(value, evidence) >= 0.8);
}

export function validateTaskEvidence(
  tasks: StructuredTask[],
  transcript: string,
  options: { evidenceOverlapThreshold?: number; taskOverlapThreshold?: number } = {},
): StructuredTask[] {
  const evidenceOverlapThreshold = options.evidenceOverlapThreshold ?? 0.8;
  const taskOverlapThreshold = options.taskOverlapThreshold ?? 0.35;
  const sentences = splitSentences(transcript);
  const validated = tasks
    .map(task => {
      const evidence = task.evidence.trim();
      const evidenceSentence = sentences.find(sentence =>
        normalize(sentence) === normalize(evidence) ||
        tokenOverlap(evidence, sentence) >= evidenceOverlapThreshold,
      );
      if (!evidenceSentence || tokenOverlap(task.task, evidenceSentence) < taskOverlapThreshold) return null;
      return {
        ...task,
        owner: isExplicitlySupported(task.owner, evidenceSentence) ? task.owner : 'Not specified',
        deadline: isExplicitlySupported(task.deadline, evidenceSentence) ? task.deadline : 'Not specified',
        evidence: evidenceSentence,
      };
    })
    .filter((task): task is StructuredTask => task !== null);

  const seen = new Set<string>();
  return validated.filter(task => {
    const key = `${normalize(task.task)}|${normalize(task.owner)}|${normalize(task.deadline)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
