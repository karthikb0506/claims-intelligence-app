/**
 * A regression check for the part of the system that decides.
 *
 * The rules and the prompts are code with no compiler behind them. Change a threshold
 * or reword a prompt and nothing fails to build - the quality just quietly moves. This
 * runs a set of cases with known correct verdicts and fails the process if any of them
 * changed, so a regression shows up before it ships.
 *
 * It evaluates the rule engine against pre-extracted facts rather than calling a model.
 * That is deliberate for now: the rules are the part that must never drift, and testing
 * them needs no network and no spend. Scoring the extraction step itself needs real
 * calls and a different kind of measurement, and is horizon 1 work.
 *
 *   npm run eval
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ClaimParameters, StudyFacts, Verdict } from '../src/contract';
import { evaluateClaim } from '../src/claims/rules/claim-rules';

interface Case {
  name: string;
  claim: ClaimParameters;
  study: StudyFacts;
  expected: Verdict;
}

const cases: Case[] = JSON.parse(readFileSync(join(__dirname, 'cases.json'), 'utf8'));

let failed = 0;

console.log(`\nRunning ${cases.length} evaluation cases\n`);

for (const testCase of cases) {
  const result = evaluateClaim(testCase.claim, testCase.study);
  const ok = result.verdict === testCase.expected;

  if (!ok) failed++;

  console.log(
    `${ok ? 'pass' : 'FAIL'}  ${testCase.name.padEnd(48)} ` +
      `expected ${testCase.expected.padEnd(22)} got ${result.verdict.padEnd(22)} ` +
      `strength ${String(result.evidenceStrength).padStart(3)}`,
  );

  if (!ok) {
    for (const finding of result.findings) {
      console.log(`        ${finding.status.padEnd(8)} ${finding.id.padEnd(20)} ${finding.detail}`);
    }
  }
}

console.log(`\n${cases.length - failed}/${cases.length} passed\n`);

if (failed > 0) {
  process.exit(1);
}
