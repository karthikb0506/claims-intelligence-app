# 5. The model sits behind an interface

## Context

The brief says to call the OpenAI API.

## Decision

`LlmProvider` is an interface with two methods, `extract` and `explain`. There are two
implementations, `OpenAiProvider` and `MockProvider`, selected by the `LLM_PROVIDER` environment
variable. Nest injects whichever is configured.

## Why

Three concrete reasons, none of them abstraction for its own sake.

**This would run on Azure.** The target estate is Azure, so in production this almost certainly
means Azure OpenAI rather than the public API, for data residency and for a no-training agreement.
That matters because the formula is a trade secret. With the interface it is a configuration
change.

**Pinned model versions get retired.** Model deprecation is a scheduled operational event, not a
hypothetical. The pinned id is stored on every assessment for reproducibility, which means the code
has to tolerate the id changing.

**Testing.** The rules and the service are tested with a fake provider injected in one line. No
network, no spend, no flakiness. This is the same thing Angular's DI buys, applied per request.

## The mock provider is not only for tests

It is the default. The whole flow runs with no API key and no cost, and the demo is deterministic.
That matters for anyone cloning this repo: a project that needs a paid key before it will start is
a project that does not get run.

It extracts the study facts with regular expressions rather than a model. That is obviously not
what the real provider does, but it is enough to drive the rule engine with realistic input, and
the sample scenarios in the UI each produce a sensible and different verdict.

Worth being explicit: the mock is not a substitute for the OpenAI implementation, it is in addition
to it. `openai.provider.ts` is complete, not a stub.
