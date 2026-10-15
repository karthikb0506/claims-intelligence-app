# 4. Synchronous request now, async shape from the start

## Context

The brief specifies `POST /api/claims/assess` returning the assessment.

With a real study report this is a 30 second to 3 minute operation: parse the document, two model
calls, persist. That is too long to hold an HTTP request open in production. Gateways time out, and
a timeout after the model call has already been paid for is the worst case.

## Decision

Implement it synchronously, but put `status` in the response from day one. It is always `COMPLETED`
today.

## Why not just build the queue

It is a one day task and a queue is not what is being assessed. Building one here would spend the
reviewer's attention on infrastructure instead of on the assessment logic, which is the actual
subject.

## Why the status field anyway

When this does move to a job plus a polling or SSE endpoint, the response grows a `PENDING` status
and the client already knows how to read it. Additive rather than breaking. The model calls also
sit behind an interface, so moving them into a worker is a wiring change, not a redesign.

One small decision now avoids a client rewrite later, and it costs a single field.

## Consequences

Anyone reading the code should know the current implementation will not survive real study
documents at real sizes. The README says so explicitly rather than leaving it to be discovered.
