# Claims Intelligence Engine

A working prototype of the core assessment flow: a scientist submits a proposed product claim and
the evidence meant to support it, the system works out whether the evidence actually holds the
claim up, stores the result, and returns it to the UI.

## The proposal

The written proposal is split into the four areas the brief asks for:

| | |
| --- | --- |
| [1. Business process](docs/01-business-process.md) | What the flow is, where the real cost sits, and the assumptions I would check with the business |
| [2. Research](docs/02-research.md) | How cosmetic claims are actually regulated, prior art, and the model failure modes that shaped the design |
| [3. Technical architecture](docs/03-architecture.md) | The central decision, the stack choices, security, and what I deliberately left out |
| [4. Product roadmap](docs/04-roadmap.md) | Four horizons, ending with designing the clinical study backwards from the target claim |

Individual decisions with their alternatives and trade-offs are in
[docs/decisions](docs/decisions).

## The one idea worth reading first

The obvious build is a single model call: send the claim and the study, ask "is this justified",
store the answer. I did not build that.

Comparing a claimed 20% against a measured 12% is arithmetic, not judgement. Handing it to a
language model makes the verdict non-deterministic, untestable, and impossible to explain to a
regulator as anything other than "the model said so". So the work is split by what each part is
actually good at:

```
  claim text + evidence text
          |
  [1] EXTRACT     language model: parse the claim, pull the study facts out
                  of the report, every fact carrying a verbatim quote
          |
  [2] EVALUATE    plain TypeScript, no model: compare, run the rule set,
                  derive the verdict and an evidence strength score
          |
  [3] EXPLAIN     language model: write up a verdict it did not choose
          |
  [4] PERSIST + HUMAN REVIEW
```

The model reads and the model writes. The code decides.

## What it does

`POST /api/claims/assess` takes a claim and its supporting evidence and returns an assessment with
one of four verdicts:

| Verdict | Meaning |
| --- | --- |
| `SUPPORTED` | The evidence substantiates the claim as worded |
| `PARTIALLY_SUPPORTED` | It supports a weaker version, and one is suggested |
| `NOT_SUPPORTED` | The evidence contradicts the claim |
| `INSUFFICIENT_EVIDENCE` | We cannot tell from this evidence |

The UI shows the Justified yes/no the brief asks for, derived from the verdict. The last two are
kept apart deliberately: "your claim is wrong" and "your study did not measure this" lead to
completely different actions, and collapsing them into "No" tells a scientist to abandon a claim
that may be perfectly valid with a longer study.

Alongside the model's self-reported confidence the response carries an evidence strength score
computed in code from study design facts: sample size, control arm, statistical significance,
measurement method and duration match. That is the number a scientist should act on, and the UI
labels both for what they are.

## Stack

React, NestJS, Prisma, PostgreSQL. Reasoning for each choice, including where Prisma falls short,
is in [docs/decisions](docs/decisions).

## Running it

Prerequisites: Node 20+, Docker running.

```bash
docker compose up -d
```

```bash
cd backend && cp .env.example .env && npm install && npx prisma migrate dev --name init && npm run start:dev
```

```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:5173, pick one of the sample scenarios, and submit.

**It runs without an OpenAI key.** `LLM_PROVIDER=mock` is the default. The mock provider extracts
study facts with regular expressions rather than a model, which is crude but enough to drive the
rule engine with realistic input, and it makes the demo deterministic and free to run.

The real provider is implemented in `backend/src/llm/openai.provider.ts`: structured outputs
against a pinned model, temperature 0, with the study text delimited and labelled as data rather
than instruction. To use it, set `LLM_PROVIDER=openai` and `OPENAI_API_KEY` in `backend/.env` and
restart. Nothing else changes, because the service does not know which provider it is talking to.

### Tests

```bash
cd backend && npm test && npm run eval
```

The evaluation suite is a small set of claim and evidence pairs with known correct verdicts. It
exists because rules and prompts are code with no compiler behind them. Without a regression check
the quality drifts and nobody notices. It is deliberately small here.

## Scope

Built: the two tables, the assess endpoint, the rule engine, both providers, the React UI, unit
tests and the evaluation suite.

Not built, and why: no job queue (the response already carries a `status` field so the move is
additive), no auth, no multi-market rule packs, no graph layer, no PDF parsing. Each one is
explained in [docs/03-architecture.md](docs/03-architecture.md) rather than quietly skipped.

The honest limitation to know up front: with a real study report this is a multi-minute operation,
which is too long to hold an HTTP request open. That is a deliberate scope decision for a one day
exercise, not an oversight.
