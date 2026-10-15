# 1. The model extracts, the rules decide

## Context

The task is to work out whether a clinical study supports a claim such as "reduces wrinkles by 20%
in 4 weeks". The obvious implementation is a single model call: send both documents, ask whether
the claim is justified, store the answer.

Most of that question is not actually a judgement. Comparing a claimed 20% against a measured 12%,
or a claimed 4 weeks against a study that ran 8, is arithmetic.

## Decision

Split the pipeline:

1. The model **extracts** — parses the claim into parameters and pulls facts out of the study, each
   fact carrying a verbatim quote from the source.
2. Plain TypeScript **evaluates** — compares the two, runs the rule set, derives the verdict.
3. The model **explains** — writes the reasoning given the facts and the rule findings.

The model is never asked whether the claim is justified.

## Alternatives considered

**Single call with a structured output schema.** Simpler and faster to build. Rejected because the
verdict then depends on the model's arithmetic, which is unreliable, non-deterministic across runs,
and impossible to explain to a regulator as anything other than "the model said so".

**Rules only, no model.** Would be fully deterministic, but something has to read a 60 page report
and turn prose into structured facts. That is exactly what language models are good at.

## Consequences

Good:

- The numeric comparison is correct every time and identical in two years.
- The rules are pure functions, so they are properly unit testable. The part that decides is the
  part with real test coverage.
- A failure is explainable as a named rule rather than a model opinion.
- Swapping the model changes the wording of the explanation, not the verdict.

Cost:

- Two model calls instead of one, so more latency and more spend. Acceptable: extraction can run on
  a cheaper model, and the whole thing is cached by evidence hash.
- The rules need maintaining. That is the point, they are the auditable part.

The rule thresholds in `claim-rules.ts` (n >= 60, p < 0.05) are placeholders I picked as reasonable
defaults. In reality they are a regulatory input and would be configured per market, not hardcoded.
