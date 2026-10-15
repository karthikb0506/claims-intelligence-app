// Three scenarios that land on different verdicts, so the demo shows the whole
// range rather than one happy path.
export const samples = [
  {
    label: 'Claim overstates the measured effect',
    productName: 'Revitalift Filler Serum',
    claimWording: 'Reduces wrinkles by 20% in 4 weeks',
    evidenceText: `Clinical evaluation of wrinkle depth following twice-daily application.
30 female subjects aged 45-60 completed the study. No vehicle-controlled arm was included.
Wrinkle depth was assessed by image analysis at baseline and at week 8.
Mean wrinkle depth showed a 12% reduction at week 8 (p = 0.04).`,
  },
  {
    label: 'Evidence supports the claim',
    productName: 'Hydra Genius Daily Liquid Care',
    claimWording: 'Increases skin hydration by 25% in 2 weeks',
    evidenceText: `Randomised, vehicle-controlled study of a daily hydrating lotion.
92 subjects (n = 92) were randomised across active and vehicle arms over 2 weeks.
Hydration was measured by corneometer instrument readings at baseline and week 2.
The active arm showed a 31% increase in hydration versus baseline (p = 0.002).`,
  },
  {
    label: 'Study does not measure the claimed effect',
    productName: 'Age Perfect Night Cream',
    claimWording: 'Reduces wrinkles by 15% in 8 weeks',
    evidenceText: `Consumer perception study of overall skin appearance.
68 participants completed a self-assessment questionnaire after 8 weeks of use.
82% of participants agreed that their skin felt smoother and more comfortable.
No instrumental measurement was performed.`,
  },
];
