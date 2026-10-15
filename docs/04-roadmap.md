# 4. Product roadmap

### Horizon 1 — make the single assessment trustworthy (0-3 months)

What is here, hardened. Azure OpenAI, real auth and role separation, async processing, the
evaluation suite running in CI, and human sign-off captured as a first-class record. The measure of
success is regulatory accepting a system-generated dossier as substantiation of record.

### Horizon 2 — turn it from a gate into a co-pilot (3-9 months)

The reframe described in section 1, built out properly.

- **Strongest defensible claim.** Invert the question: given this evidence, what is the best claim
  it supports? The prototype gestures at this with a suggested alternative wording; the real
  version generates candidates and ranks them by risk.
- **Gap report.** "Add a vehicle-controlled arm and 30 subjects and your original claim becomes
  supportable." Actionable, and it is the output scientists actually want.
- **Market matrix.** Assess one claim against EU, US, CN and IN simultaneously. Approved in three
  of five, with the specific blocker for each failure.
- **Evidence library with semantic search.** `pgvector` over past studies. The immediate return is
  not search quality, it is not commissioning a study you have already run.

### Horizon 3 — adversarial assessment and connected data (9-18 months)

**An agent that argues against the claim.** The dominant failure mode here is agreeableness. Rather
than prompting a single model to be stricter, run a challenger whose only job is to build the case
that the evidence does not hold, then synthesise both sides. In a compliance system you want the
machine arguing with you.

**A graph layer, when it earns itself.** The question that justifies it is a real one: *this study
has been retracted — which claims, on which products, in which markets, are now unsubstantiated?*
That is a variable-depth traversal across ingredient, study, claim, product, market and regulation,
and it is awkward and slow in SQL. I would introduce it when that class of question becomes a
product feature, keep Postgres as the system of record and project into the graph as a read model,
and I would try Apache AGE inside Postgres before committing to running a second database.

Paired with that: proactive re-assessment. A regulation changes or a study is withdrawn, and every
affected claim is re-evaluated automatically instead of someone running a manual audit.

### Horizon 4 — design the study backwards from the claim (18 months+)

Today a study is run and then someone finds out whether it supports the target claim. Inverted:

```
marketing proposes a target claim
  -> system states the evidence that would substantiate it in each market
     (n, duration, control design, measurement method), derived from prior studies
  -> the study is designed to exactly that specification
  -> results return and are assessed against the original target
```

Clinical studies are expensive and slow. Telling a scientist before they spend the budget that
their protocol will not substantiate the claim they are aiming at turns this from a review tool
into R&D spend optimisation. That is the version of this product I would actually want to build.

---
