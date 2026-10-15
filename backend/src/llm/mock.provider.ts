import { Injectable } from '@nestjs/common';
import {
  ExplainInput,
  ExplanationResult,
  ExtractionResult,
  LlmProvider,
} from './llm.types';

/**
 * Default provider. Lets the whole flow run offline, with no key and no spend,
 * and makes the demo deterministic.
 *
 * It does a crude parse of the claim wording and reads the study facts out of the
 * submitted text with regular expressions. That is obviously not what the real
 * provider does, but it is enough to drive the rule engine with realistic input,
 * and it keeps the sample scenarios giving genuinely different verdicts.
 */
@Injectable()
export class MockProvider implements LlmProvider {
  readonly modelId = 'mock-extractor@1';

  async extract(claimWording: string, evidenceText: string): Promise<ExtractionResult> {
    const claimText = claimWording.toLowerCase();
    const study = evidenceText.toLowerCase();

    const claimMagnitude = this.firstNumber(claimText, /(\d+(?:\.\d+)?)\s*%/);
    const claimDuration = this.firstNumber(claimText, /(\d+)\s*weeks?/);

    const metric = this.guessMetric(claimText);
    const measuresClaimedMetric = metric ? study.includes(metric.split(' ')[0]) : null;

    const effectPercent = this.firstNumber(study, /(\d+(?:\.\d+)?)\s*%\s*(?:reduction|decrease|improvement|increase)/);

    const sampleSize =
      this.firstNumber(study, /n\s*=\s*(\d+)/) ??
      // allow a few words between the number and the noun, e.g. "30 female subjects"
      this.firstNumber(study, /(\d+)\s+(?:[a-z]+\s+){0,3}(?:subjects|participants|volunteers)/);

    // studies phrase this both ways: "over 8 weeks" and "at week 8"
    const durationWeeks =
      this.firstNumber(study, /(\d+)\s*weeks?\b/) ?? this.firstNumber(study, /weeks?\s*(\d+)/);

    const pValue = this.firstNumber(study, /p\s*[<=]\s*(0?\.\d+)/);

    // Check the negation first. "No vehicle-controlled arm was included" contains
    // "vehicle-controlled", so matching the positive pattern first gets this backwards,
    // which is the worst possible direction to be wrong in.
    const controlDenied =
      /\b(?:no|without|not)\b[^.]{0,40}(?:vehicle|placebo|control)/.test(study) ||
      /uncontrolled|single[- ]arm/.test(study);
    const controlStated = /(?:vehicle|placebo)[- ]controlled|control (?:group|arm)/.test(study);
    const hasControlGroup = controlDenied ? false : controlStated ? true : null;

    // Self-assessment is checked first on purpose. A perception study often also
    // mentions instruments, usually to say none were used.
    const measurementMethod = /self[- ]assess|questionnaire|self[- ]report|perception study/.test(study)
      ? 'self-assessment'
      : /expert grading|dermatologist grading/.test(study)
        ? 'expert grading'
        : /profilometry|instrument|image analysis|corneometer/.test(study) &&
            !/\b(?:no|without|not)\b[^.]{0,30}(?:instrument|measurement)/.test(study)
          ? 'instrumental'
          : null;

    const citations = this.citationsFor(evidenceText, [
      ['effectPercent', /[^.]*%[^.]*\./],
      ['sampleSize', /[^.]*(?:n\s*=\s*\d+|subjects|participants)[^.]*\./i],
      ['durationWeeks', /[^.]*weeks?[^.]*\./i],
      ['pValue', /[^.]*p\s*[<=][^.]*\./i],
    ]);

    const result: ExtractionResult = {
      claim: {
        metric,
        magnitudePercent: claimMagnitude,
        durationWeeks: claimDuration,
        population: null,
      },
      study: {
        measuresClaimedMetric,
        effectPercent,
        durationWeeks,
        sampleSize,
        hasControlGroup,
        pValue,
        measurementMethod,
        citations,
      },
      // fixed on purpose. A made up number that moves around would imply a
      // precision the mock does not have.
      modelConfidence: 0.75,
      raw: null,
    };

    result.raw = { provider: 'mock', extracted: { claim: result.claim, study: result.study } };
    return result;
  }

  async explain(input: ExplainInput): Promise<ExplanationResult> {
    const failed = input.findings.filter((f) => f.status === 'FAIL');
    const warned = input.findings.filter((f) => f.status === 'WARN');
    const unknown = input.findings.filter((f) => f.status === 'UNKNOWN');

    // details already end in a full stop, so trim before joining them into a sentence
    const list = (items: typeof failed) => items.map((f) => f.detail.replace(/\.\s*$/, '')).join('; ');

    const parts: string[] = [];

    if (failed.length) {
      parts.push(`The evidence does not support the claim as worded: ${list(failed)}.`);
    } else if (unknown.length) {
      parts.push(`The submitted evidence does not contain enough to judge this claim: ${list(unknown)}.`);
    } else {
      parts.push('The study measures the claimed effect and the reported result meets the claimed magnitude.');
    }

    if (warned.length) {
      parts.push(`Weaknesses in the study design limit how strongly this can be stated: ${list(warned)}.`);
    }

    const suggestedClaim =
      input.verdict === 'PARTIALLY_SUPPORTED'
        ? this.weakenClaim(input.claimWording)
        : null;

    return {
      reasoning: parts.join(' '),
      suggestedClaim,
      raw: { provider: 'mock', verdict: input.verdict },
    };
  }

  private weakenClaim(wording: string): string {
    // drop the quantified part, which is almost always what fails
    const withoutNumbers = wording
      .replace(/\s*by\s*\d+(\.\d+)?\s*%/i, '')
      .replace(/\s*in\s*\d+\s*weeks?/i, '')
      .trim()
      .replace(/\s+/g, ' ');
    return `Visibly ${withoutNumbers.charAt(0).toLowerCase()}${withoutNumbers.slice(1)}`;
  }

  private guessMetric(claimText: string): string | null {
    const known = ['wrinkle', 'hydration', 'firmness', 'elasticity', 'dark spot', 'hair breakage'];
    return known.find((k) => claimText.includes(k)) ?? null;
  }

  private firstNumber(text: string, pattern: RegExp): number | null {
    const match = text.match(pattern);
    return match ? Number(match[1]) : null;
  }

  private citationsFor(text: string, patterns: [string, RegExp][]) {
    return patterns
      .map(([field, pattern]) => {
        const match = text.match(pattern);
        return match ? { field, quote: match[0].trim() } : null;
      })
      .filter((c): c is { field: string; quote: string } => c !== null);
  }
}
