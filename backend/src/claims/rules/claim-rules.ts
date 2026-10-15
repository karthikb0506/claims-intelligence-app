import { ClaimParameters, RuleFinding, StudyFacts, Verdict } from '../../contract';

export const RULES_VERSION = 'rules@1';

// Placeholders chosen as reasonable defaults. In production these are a regulatory
// input and would be configured per market rather than hardcoded here.
const MIN_SAMPLE_SIZE = 60;
const MAX_P_VALUE = 0.05;

// Weights for the evidence strength score. These rules say how good the study is,
// as opposed to whether it supports this particular claim.
const STRENGTH_WEIGHTS: Record<string, number> = {
  sample_size: 25,
  control_group: 25,
  significance: 25,
  measurement_method: 15,
  duration: 10,
};

// Without these two we are not judging the claim, we are guessing.
const CRITICAL_RULES = ['metric_measured', 'magnitude'];

export interface Evaluation {
  verdict: Verdict;
  findings: RuleFinding[];
  evidenceStrength: number;
}

/**
 * Compares a claim against the facts extracted from a study. No model involved:
 * same input, same output, every time, which is the whole point of this file.
 */
export function evaluateClaim(claim: ClaimParameters, study: StudyFacts): Evaluation {
  const findings: RuleFinding[] = [
    metricMeasured(claim, study),
    magnitude(claim, study),
    duration(claim, study),
    sampleSize(study),
    controlGroup(study),
    significance(study),
    measurementMethod(study),
  ];

  return {
    verdict: deriveVerdict(findings),
    findings,
    evidenceStrength: scoreEvidence(findings),
  };
}

function metricMeasured(claim: ClaimParameters, study: StudyFacts): RuleFinding {
  const label = 'Study measures the claimed effect';

  if (study.measuresClaimedMetric === true) {
    return finding('metric_measured', label, 'PASS', `The study measures ${claim.metric ?? 'the claimed effect'}.`);
  }
  if (study.measuresClaimedMetric === false) {
    return finding(
      'metric_measured',
      label,
      'UNKNOWN',
      `The study does not measure ${claim.metric ?? 'the claimed effect'}, so this claim cannot be assessed from it.`,
    );
  }
  return finding('metric_measured', label, 'UNKNOWN', 'Could not establish what the study measures.');
}

function magnitude(claim: ClaimParameters, study: StudyFacts): RuleFinding {
  const label = 'Claimed magnitude is supported';

  if (claim.magnitudePercent === null) {
    return finding('magnitude', label, 'PASS', 'The claim is qualitative, so there is no magnitude to verify.');
  }
  if (study.effectPercent === null) {
    return finding('magnitude', label, 'UNKNOWN', 'The study does not report an effect size to compare against.');
  }
  if (study.effectPercent >= claim.magnitudePercent) {
    return finding(
      'magnitude',
      label,
      'PASS',
      `Claimed ${claim.magnitudePercent}%, study reports ${study.effectPercent}%.`,
    );
  }
  return finding(
    'magnitude',
    label,
    'FAIL',
    `Claimed ${claim.magnitudePercent}% but the study reports ${study.effectPercent}%.`,
  );
}

function duration(claim: ClaimParameters, study: StudyFacts): RuleFinding {
  const label = 'Claimed timeframe matches the study';

  if (claim.durationWeeks === null) {
    return finding('duration', label, 'PASS', 'The claim does not state a timeframe.');
  }
  if (study.durationWeeks === null) {
    return finding('duration', label, 'UNKNOWN', 'The study does not state its duration.');
  }
  if (study.durationWeeks === claim.durationWeeks) {
    return finding('duration', label, 'PASS', `Both claim and study use ${claim.durationWeeks} weeks.`);
  }
  if (study.durationWeeks > claim.durationWeeks) {
    return finding(
      'duration',
      label,
      'WARN',
      `The claim says ${claim.durationWeeks} weeks but the result was measured at ${study.durationWeeks} weeks. Interim data at ${claim.durationWeeks} weeks would be needed.`,
    );
  }
  return finding(
    'duration',
    label,
    'WARN',
    `The study ran for ${study.durationWeeks} weeks, shorter than the claimed ${claim.durationWeeks} weeks.`,
  );
}

function sampleSize(study: StudyFacts): RuleFinding {
  const label = 'Sample size';

  if (study.sampleSize === null) {
    return finding('sample_size', label, 'UNKNOWN', 'The study does not report its sample size.');
  }
  if (study.sampleSize >= MIN_SAMPLE_SIZE) {
    return finding('sample_size', label, 'PASS', `n = ${study.sampleSize}.`);
  }
  return finding(
    'sample_size',
    label,
    'WARN',
    `n = ${study.sampleSize}, below the ${MIN_SAMPLE_SIZE} subject threshold used here.`,
  );
}

function controlGroup(study: StudyFacts): RuleFinding {
  const label = 'Control arm';

  if (study.hasControlGroup === null) {
    return finding('control_group', label, 'UNKNOWN', 'The study does not state whether there was a control arm.');
  }
  if (study.hasControlGroup) {
    return finding('control_group', label, 'PASS', 'The study is vehicle or placebo controlled.');
  }
  return finding(
    'control_group',
    label,
    'WARN',
    'No control arm, so the measured effect cannot be separated from regression to the mean or seasonal change.',
  );
}

function significance(study: StudyFacts): RuleFinding {
  const label = 'Statistical significance';

  if (study.pValue === null) {
    return finding('significance', label, 'UNKNOWN', 'The study does not report a p value.');
  }
  if (study.pValue <= MAX_P_VALUE) {
    return finding('significance', label, 'PASS', `p = ${study.pValue}.`);
  }
  return finding(
    'significance',
    label,
    'FAIL',
    `p = ${study.pValue}, above ${MAX_P_VALUE}. The reported effect is not statistically significant.`,
  );
}

function measurementMethod(study: StudyFacts): RuleFinding {
  const label = 'Measurement method';

  if (study.measurementMethod === null) {
    return finding('measurement_method', label, 'UNKNOWN', 'The study does not state how the effect was measured.');
  }
  if (study.measurementMethod === 'self-assessment') {
    return finding(
      'measurement_method',
      label,
      'WARN',
      'Self-assessment only. Supports a perception claim rather than a measured one.',
    );
  }
  return finding('measurement_method', label, 'PASS', `Measured by ${study.measurementMethod}.`);
}

/**
 * Order matters here. "We cannot tell" has to beat "this is wrong", because
 * calling a claim unsupported means knowing enough to say so.
 */
function deriveVerdict(findings: RuleFinding[]): Verdict {
  const byId = new Map(findings.map((f) => [f.id, f]));

  const criticalUnknown = CRITICAL_RULES.some((id) => byId.get(id)?.status === 'UNKNOWN');
  if (criticalUnknown) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (findings.some((f) => f.status === 'FAIL')) {
    return 'NOT_SUPPORTED';
  }

  if (findings.some((f) => f.status === 'WARN' || f.status === 'UNKNOWN')) {
    return 'PARTIALLY_SUPPORTED';
  }

  return 'SUPPORTED';
}

function scoreEvidence(findings: RuleFinding[]): number {
  let score = 0;
  for (const f of findings) {
    const weight = STRENGTH_WEIGHTS[f.id];
    if (!weight) continue;
    if (f.status === 'PASS') score += weight;
    else if (f.status === 'WARN') score += weight / 2;
  }
  return Math.round(score);
}

function finding(
  id: string,
  label: string,
  status: RuleFinding['status'],
  detail: string,
): RuleFinding {
  return { id, label, status, detail };
}
