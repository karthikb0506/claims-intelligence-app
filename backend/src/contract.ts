// The API contract. The backend owns it, the React app imports it directly so that
// a change here is a compile error on the client rather than a blank panel.

export type Verdict =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'NOT_SUPPORTED'
  | 'INSUFFICIENT_EVIDENCE';

export type RuleStatus = 'PASS' | 'FAIL' | 'WARN' | 'UNKNOWN';

export interface RuleFinding {
  id: string;
  label: string;
  status: RuleStatus;
  detail: string;
}

export interface Citation {
  field: string;
  quote: string;
}

export interface ClaimParameters {
  metric: string | null;
  magnitudePercent: number | null;
  durationWeeks: number | null;
  population: string | null;
}

export interface StudyFacts {
  measuresClaimedMetric: boolean | null;
  effectPercent: number | null;
  durationWeeks: number | null;
  sampleSize: number | null;
  hasControlGroup: boolean | null;
  pValue: number | null;
  measurementMethod: string | null;
  citations: Citation[];
}

export interface AssessmentResponse {
  id: string;
  claimId: string;
  // always COMPLETED today. Here from the start so moving to a job queue
  // is an additive change for the client rather than a breaking one.
  status: 'COMPLETED';

  verdict: Verdict;
  // what the brief asks the UI to show. Derived, not stored.
  justified: boolean;

  // the model's own number. Not a calibrated probability.
  modelConfidence: number;
  // 0-100, computed from study design facts by the rule engine.
  evidenceStrength: number;

  reasoning: string;
  suggestedClaim: string | null;

  findings: RuleFinding[];
  claimParameters: ClaimParameters;
  studyFacts: StudyFacts;

  provenance: {
    modelId: string;
    promptVersion: string;
    rulesVersion: string;
    evidenceHash: string;
  };

  createdAt: string;
}
