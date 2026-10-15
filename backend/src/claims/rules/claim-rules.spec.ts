import { ClaimParameters, StudyFacts } from '../../contract';
import { evaluateClaim } from './claim-rules';

const claim = (over: Partial<ClaimParameters> = {}): ClaimParameters => ({
  metric: 'wrinkle',
  magnitudePercent: 20,
  durationWeeks: 4,
  population: null,
  ...over,
});

const study = (over: Partial<StudyFacts> = {}): StudyFacts => ({
  measuresClaimedMetric: true,
  effectPercent: 22,
  durationWeeks: 4,
  sampleSize: 80,
  hasControlGroup: true,
  pValue: 0.01,
  measurementMethod: 'instrumental',
  citations: [],
  ...over,
});

describe('evaluateClaim', () => {
  it('supports a claim when a well designed study meets it', () => {
    const result = evaluateClaim(claim(), study());

    expect(result.verdict).toBe('SUPPORTED');
    expect(result.evidenceStrength).toBe(100);
  });

  it('rejects the claim when the measured effect is smaller than claimed', () => {
    const result = evaluateClaim(claim({ magnitudePercent: 20 }), study({ effectPercent: 12 }));

    expect(result.verdict).toBe('NOT_SUPPORTED');
    expect(result.findings.find((f) => f.id === 'magnitude')?.status).toBe('FAIL');
  });

  // The distinction this whole design hangs on: not knowing is not the same as being wrong.
  it('returns INSUFFICIENT_EVIDENCE when the study does not measure the claimed effect', () => {
    const result = evaluateClaim(claim(), study({ measuresClaimedMetric: false, effectPercent: 5 }));

    expect(result.verdict).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('returns INSUFFICIENT_EVIDENCE rather than NOT_SUPPORTED when no effect size is reported', () => {
    const result = evaluateClaim(claim(), study({ effectPercent: null }));

    expect(result.verdict).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('downgrades to PARTIALLY_SUPPORTED when the timeframe does not match', () => {
    const result = evaluateClaim(claim({ durationWeeks: 4 }), study({ durationWeeks: 8 }));

    expect(result.verdict).toBe('PARTIALLY_SUPPORTED');
    expect(result.findings.find((f) => f.id === 'duration')?.status).toBe('WARN');
  });

  it('downgrades on a weak study design even when the numbers are met', () => {
    const result = evaluateClaim(
      claim(),
      study({ sampleSize: 25, hasControlGroup: false, measurementMethod: 'self-assessment' }),
    );

    expect(result.verdict).toBe('PARTIALLY_SUPPORTED');
    expect(result.evidenceStrength).toBeLessThan(70);
  });

  it('fails a claim whose result is not statistically significant', () => {
    const result = evaluateClaim(claim(), study({ pValue: 0.2 }));

    expect(result.verdict).toBe('NOT_SUPPORTED');
  });

  it('treats a qualitative claim as having no magnitude to verify', () => {
    const result = evaluateClaim(
      claim({ magnitudePercent: null, durationWeeks: null }),
      study({ effectPercent: 3 }),
    );

    expect(result.verdict).toBe('SUPPORTED');
  });
});
