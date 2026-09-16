import { RiskLevel, ProposedAction } from '../src/types.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: 'EMPTY_INPUT' | 'TOO_SHORT' | 'UNSUPPORTED' | 'INVALID';
}

export class GuardrailsService {
  /**
   * Section 9: Validate user input before passing to AI
   */
  validateInput(input: string | undefined | null): ValidationResult {
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return {
        valid: false,
        code: 'EMPTY_INPUT',
        error: 'Please provide a voice recording or transcript before continuing.',
      };
    }

    const trimmed = input.trim();
    if (trimmed.length < 8) {
      return {
        valid: false,
        code: 'TOO_SHORT',
        error: 'Please provide more context so the assistant can identify tasks accurately.',
      };
    }

    // Check for gibberish or only punctuation
    const alphanumericCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
    if (alphanumericCount < 4) {
      return {
        valid: false,
        code: 'INVALID',
        error: 'The input does not contain enough recognizable words to analyze.',
      };
    }

    return { valid: true };
  }

  /**
   * Section 15 & 16: Detect consequential and high risk actions
   */
  evaluateRisk(transcript: string, existingActions: ProposedAction[] = []): {
    riskLevel: RiskLevel;
    confirmationRequired: boolean;
    detectedProposedActions: ProposedAction[];
    riskExplanation: string;
  } {
    const lower = transcript.toLowerCase();
    const detectedActions: ProposedAction[] = [...existingActions];

    let hasHighRisk = false;
    let hasMediumRisk = false;
    const reasons: string[] = [];

    // Financial actions (HIGH risk)
    const financialMatches = lower.match(/(transfer|send|wire|pay|disburse|remit|spend)\s+(?:₹|inr|rs\.?|\$|usd|eur|amount\s+of)?\s*[\d,]+|pay\s+(?:the\s+)?vendor|transfer\s+funds/i);
    if (financialMatches) {
      hasHighRisk = true;
      reasons.push('Contains a financial disbursement or monetary transaction.');
      if (!detectedActions.some(a => a.category === 'financial')) {
        detectedActions.push({
          id: `act-${Date.now()}-fin`,
          action: financialMatches[0].trim(),
          reason: 'Financial transfers modify funds and cannot be reversed automatically.',
          requires_confirmation: true,
          category: 'financial',
          status: 'AWAITING_CONFIRMATION',
        });
      }
    }

    // Deletion actions (HIGH risk)
    const deletionMatches = lower.match(/(delete|drop|wipe|purge|remove\s+all|truncate)\s+(database|table|records|users|logs|files|repo)/i);
    if (deletionMatches) {
      hasHighRisk = true;
      reasons.push('Contains destructive data deletion or database modification.');
      if (!detectedActions.some(a => a.category === 'deletion')) {
        detectedActions.push({
          id: `act-${Date.now()}-del`,
          action: deletionMatches[0].trim(),
          reason: 'Permanent deletion of system data is irreversible and requires administrative approval.',
          requires_confirmation: true,
          category: 'deletion',
          status: 'AWAITING_CONFIRMATION',
        });
      }
    }

    // Security & Credential requests (HIGH risk / Unsupported)
    const securityMatches = lower.match(/(give\s+me|show\s+me|reveal|share|send)\s+(?:.*)?(password|credential|secret\s+key|private\s+key|token|auth)/i);
    if (securityMatches) {
      hasHighRisk = true;
      reasons.push('Requests private credentials or access secrets.');
      if (!detectedActions.some(a => a.category === 'security')) {
        detectedActions.push({
          id: `act-${Date.now()}-sec`,
          action: securityMatches[0].trim(),
          reason: 'Security protocols strictly prohibit extracting or transmitting private credentials.',
          requires_confirmation: true,
          category: 'security',
          status: 'AWAITING_CONFIRMATION',
        });
      }
    }

    // External communications & messages (MEDIUM risk)
    const commsMatches = lower.match(/(send|email|mail|broadcast|dispatch|blast)\s+(?:the\s+)?(final\s+report|report|update|message|newsletter|invoice|contract)\s+(?:to\s+[\w\s]+)?/i);
    if (commsMatches && !hasHighRisk) {
      hasMediumRisk = true;
      reasons.push('Involves sending messages or reports to external stakeholders.');
      if (!detectedActions.some(a => a.category === 'communication')) {
        detectedActions.push({
          id: `act-${Date.now()}-com`,
          action: commsMatches[0].trim(),
          reason: 'Sending external documents or messages notifies outside parties and requires review.',
          requires_confirmation: true,
          category: 'communication',
          status: 'AWAITING_CONFIRMATION',
        });
      }
    }

    // Permissions & Account changes (HIGH risk)
    const permissionMatches = lower.match(/(change\s+role|grant\s+admin|elevate\s+permissions|revoke\s+access|delete\s+account)/i);
    if (permissionMatches) {
      hasHighRisk = true;
      reasons.push('Involves permission elevation or user access control changes.');
      if (!detectedActions.some(a => a.category === 'security')) {
        detectedActions.push({
          id: `act-${Date.now()}-perm`,
          action: permissionMatches[0].trim(),
          reason: 'Access control modifications alter organizational security boundaries.',
          requires_confirmation: true,
          category: 'security',
          status: 'AWAITING_CONFIRMATION',
        });
      }
    }

    const riskLevel: RiskLevel = hasHighRisk ? 'HIGH' : hasMediumRisk ? 'MEDIUM' : 'LOW';
    const confirmationRequired = hasHighRisk || hasMediumRisk || detectedActions.length > 0;

    let riskExplanation = 'Routine planning and task extraction with standard operational impact.';
    if (hasHighRisk) {
      riskExplanation = `High risk detected: ${reasons.join(' ')} This action must NEVER execute automatically. Human review and explicit confirmation are required.`;
    } else if (hasMediumRisk) {
      riskExplanation = `Medium risk detected: ${reasons.join(' ')} User confirmation is required before proceeding.`;
    }

    return {
      riskLevel,
      confirmationRequired,
      detectedProposedActions: detectedActions,
      riskExplanation,
    };
  }
}

export const guardrails = new GuardrailsService();
