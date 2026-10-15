# 2. Research

I am not a cosmetics regulatory specialist. This is what I established in the time available and
what I would want validated by the R&I and regulatory teams.

### How cosmetic claims are actually governed

In the EU, cosmetic claims fall under **Regulation (EC) No 1223/2009** (Article 20 covers claims),
with **Commission Regulation (EU) No 655/2013** setting out six common criteria every claim has to
meet:

```
legal compliance | truthfulness | evidential support
honesty          | fairness     | informed decision making
```

That list is the single most useful thing I found, because it gives the assessment a rubric that
is not my invention. The structured output follows those criteria rather than a scoring scheme I
made up, which means the reasoning is framed in the same terms a regulator would use.

Other jurisdictions differ enough to matter: ASA/CAP in the UK, FTC substantiation guidance in the
US, ASCI in India, NMPA in China. This is the evidence for assumption 1 above.

### Prior art

Pharmaceutical companies already run a mature version of this workflow — Medical, Legal and
Regulatory review of promotional material. Cosmetic claim substantiation is a lighter variant of
the same problem. Worth knowing because the governance model (machine assists, qualified human
signs, everything is logged) is settled there and does not need reinventing.

### What makes clinical evidence strong

This became the rule set, so it is worth listing: sample size, randomisation, blinding, presence of
a vehicle or placebo control, statistical significance separate from effect size, measurement
method (instrumental vs expert grading vs self-assessment), and study duration.

### Where language models fail at this specific task

Three failure modes are directly relevant and each one changed a design decision:

| Failure mode | What I did about it |
| --- | --- |
| Weak arithmetic and statistical reasoning | The comparison is done in code, not by the model |
| Agreeableness — models lean towards confirming the premise they are handed | The verdict is derived from deterministic rules the model cannot influence |
| Self-reported confidence is not calibrated | Reported, but labelled as the model's own opinion, alongside a separate score computed from study design facts |

---
