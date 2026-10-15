import { ClaimParameters, RuleFinding, StudyFacts, Verdict } from '../contract';

export const LLM_PROVIDER = 'LLM_PROVIDER';

export const PROMPT_VERSION = 'claim-assess@1';

export interface ExtractionResult {
  claim: ClaimParameters;
  study: StudyFacts;
  modelConfidence: number;
  // kept verbatim so we can show later what the model actually returned,
  // not just what we parsed out of it
  raw: unknown;
}

export interface ExplainInput {
  claimWording: string;
  verdict: Verdict;
  claim: ClaimParameters;
  study: StudyFacts;
  findings: RuleFinding[];
}

export interface ExplanationResult {
  reasoning: string;
  suggestedClaim: string | null;
  raw: unknown;
}

/**
 * Two methods, both deliberately narrow. The model reads and the model writes.
 * It is never asked whether the claim is justified - that is the rule engine's job.
 */
export interface LlmProvider {
  readonly modelId: string;
  extract(claimWording: string, evidenceText: string): Promise<ExtractionResult>;
  explain(input: ExplainInput): Promise<ExplanationResult>;
}
