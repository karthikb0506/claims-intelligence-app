# 2. Four verdicts, not a boolean

## Context

The brief asks the UI to display "Justified: Yes/No".

## Decision

The UI shows yes/no. The stored verdict has four values:

- `SUPPORTED`
- `PARTIALLY_SUPPORTED`
- `NOT_SUPPORTED`
- `INSUFFICIENT_EVIDENCE`

## Why

`NOT_SUPPORTED` and `INSUFFICIENT_EVIDENCE` are different statements with different consequences.

"The study measured 12% against your claimed 20%" means the claim is wrong and should be dropped or
reworded. "The study did not measure wrinkle depth at all" means we have no idea whether the claim
is true. The product may be fine and the study simply did not test for it.

Collapsing both into "No" tells a scientist to abandon a claim that might be perfectly valid with a
longer or differently designed study. That is an expensive wrong decision caused by a lazy data
type.

`PARTIALLY_SUPPORTED` exists because it is where most real cases land. The evidence rarely supports
the claim exactly as marketing first wrote it, but it usually supports something. That verdict is
what makes the suggested alternative wording useful rather than decorative.

## Consequences

The frontend derives the yes/no the brief asked for (`SUPPORTED` is yes, everything else is no) and
shows the underlying verdict alongside it, so nothing is hidden from the user.

Adding a verdict value later is a migration. I would rather have the right four now than add them
under pressure.
