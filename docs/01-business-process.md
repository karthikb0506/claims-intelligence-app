# 1. Business process

My reading of the flow described in the brief:

```
Business proposes claims -> Claim manager filters -> Scientist formulates and submits
                                                  -> Evaluator tests and submits a report
```

The gap this tool fills sits at the end of that chain. Someone has to look at a claim such as
*"Reduces wrinkles by 20% in 4 weeks"* alongside a clinical study report and decide whether one
genuinely supports the other.

Today that is a person with two documents open side by side. That has four problems:

| Problem | Effect |
| --- | --- |
| Slow | Days or weeks per claim, and the launch waits on it |
| Inconsistent | Two reviewers, two conclusions, no shared standard |
| Does not scale | Thousands of SKUs, several claims each, multiple markets |
| Badly recorded | The reasoning ends up in email threads and people's memory |

The fourth one is the one that actually matters, and it shaped most of the design.

**A claim is a legal assertion, not a marketing line.** A regulator can ask for substantiation
years after launch. So the real output of this system is not a yes/no answer — it is a defensible
record of why a claim was accepted or rejected, against which evidence, under which rules, approved
by which person. The verdict is the cheap part. The audit trail is the product.

Two consequences follow directly:

**The model cannot be the decision maker.** It produces a first-pass assessment. A human signs.
Anything else turns a compliance process into an unauditable one, which is worse than the manual
process it replaced.

**The useful question is not "is this claim allowed?"** A scientist who has spent months and a real
budget on a study is not trying to get a yes. They are trying to find the strongest claim their
data can honestly defend. A system that only says "no" gets routed around. A system that says
"not this, but you can say *this*, and here is what would unlock the claim you wanted" gets used.

I have built the yes/no the brief asks for, and then taken one step past it: the response includes
what is missing and, where the evidence supports something weaker, a suggested alternative wording.

### Assumptions I would check with the business

I had no access to stakeholders, so these are stated rather than resolved:

1. **Claims are market specific.** The same formula and study may substantiate a claim in the EU
   but not in the US or China. I have modelled a `market` field on the claim but assess against one
   market at a time. A multi-market matrix is a real feature, not a config flag.
2. **Claim wording changes constantly**, and each wording is a separate legal assertion. In
   production I would split `ClaimVersion` out from `Claim` so an assessment attaches to an exact
   wording. The brief asked for two tables, so I kept two — see
   [decision 3](decisions/0003-prisma-and-postgres.md).
3. **Evidence is reused.** One study can support claims across several products, so in production
   evidence is its own entity rather than a column on the assessment.
4. **The formula is a trade secret.** Sending real formulations to a third party API is a
   commercial risk before it is a privacy one. See [security](03-architecture.md#security-and-data-handling).

---
