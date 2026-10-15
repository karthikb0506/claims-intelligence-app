# 3. Prisma and PostgreSQL

## Context

The brief allows either a Prisma schema or a TypeORM entity, and does not specify a database.

## Decision

Prisma on PostgreSQL. Two tables, `Claim` and `Assessment`, as asked.

## Prisma over TypeORM

The generated client types flow from the schema into the service and into the response type the
React app consumes. A schema change becomes a compile error rather than a runtime surprise. Given
the stack is TypeScript end to end, that is the main benefit on offer, and TypeORM's decorator
approach gives it up for weaker typing.

Prisma Migrate also produces plain SQL files committed to the repo. In a domain where schema
changes are themselves auditable, a reviewable migration history is worth something.

**The limitation, stated plainly:** Prisma's query API has no window functions, CTEs, unions or
recursive queries. The reporting work in horizon 2 (approval rate per market, ranked, over time)
cannot be expressed in it and would drop to `$queryRaw`, giving up type safety on those queries. I
consider that an acceptable split: Prisma for the application layer, SQL for reporting. Drizzle
would be the alternative worth evaluating if the reporting side grew.

## PostgreSQL

The load-bearing decision is relational over document. The data is genuinely connected and the
connections need enforcing by the database rather than by application code, because an assessment
pointing at a claim that no longer exists is a compliance problem, not a bug.

MySQL would be defensible and I would not fight a team already running it. Postgres specifically
because:

- `jsonb` holds the variable model output in the same table as the structured fields and is still
  queryable and indexable. No second store for the flexible part.
- `pgvector` means the evidence library semantic search in horizon 2 lives in the same database.
  Avoiding a second datastore avoids a sync problem.
- Transactional DDL, so a failed migration rolls back cleanly. MySQL leaves you half applied.
- Azure has first class managed Postgres, which matches where this would actually run.

## Two tables, and what I would change

The brief asked for `Claim` and `Assessment`, so that is what is here. In production I would split
out:

- `ClaimVersion`, because wording changes constantly and each wording is a separate legal
  assertion. An assessment should attach to an exact wording, not to a mutable claim row.
- `Evidence`, because one study supports claims across several products and should be stored once
  and referenced.
- `ReviewDecision`, because "the model concluded X" and "a qualified human approved X" are
  different facts. Storing them in one row makes it impossible to answer whether a person actually
  signed off.

For now the evidence text and its hash sit on the assessment, and citations and rule findings are
`jsonb` columns rather than child tables.
