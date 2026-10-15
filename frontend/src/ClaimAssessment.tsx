import type { AssessmentResponse, RuleFinding } from '@contract';
import { useState } from 'react';
import { assessClaim } from './api';
import { samples } from './samples';

export function ClaimAssessment() {
  const [productName, setProductName] = useState(samples[0].productName);
  const [claimWording, setClaimWording] = useState(samples[0].claimWording);
  const [evidenceText, setEvidenceText] = useState(samples[0].evidenceText);
  const [market, setMarket] = useState('EU');

  const [result, setResult] = useState<AssessmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function loadSample(index: number) {
    const sample = samples[index];
    setProductName(sample.productName);
    setClaimWording(sample.claimWording);
    setEvidenceText(sample.evidenceText);
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const assessment = await assessClaim({ productName, claimWording, evidenceText, market });
      setResult(assessment);
    } catch (err) {
      // keep whatever the user typed. A failed assessment should not cost them their input.
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header>
        <h1>Claims Intelligence Engine</h1>
        <p className="subtitle">
          Assess whether submitted evidence substantiates a proposed product claim.
        </p>
      </header>

      <div className="samples"> 
        <span>Load a scenario:</span>
        {samples.map((sample, i) => (
          <button key={sample.label} type="button" onClick={() => loadSample(i)}>
            {sample.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <label>
          Product
          <input value={productName} onChange={(e) => setProductName(e.target.value)} required />
        </label>

        <label>
          Proposed claim
          <input value={claimWording} onChange={(e) => setClaimWording(e.target.value)} required />
        </label>

        <label>
          Market
          <select value={market} onChange={(e) => setMarket(e.target.value)}>
            <option value="EU">EU</option>
            <option value="US">US</option>
            <option value="IN">IN</option>
            <option value="CN">CN</option>
          </select>
        </label>

        <label>
          Supporting evidence
          <textarea
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            rows={9}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Assessing...' : 'Assess claim'}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {result && <Result assessment={result} />}
    </div>
  );
}

function Result({ assessment }: { assessment: AssessmentResponse }) {
  return (
    <section className="result" aria-live="polite">
      <div className={`verdict ${assessment.justified ? 'yes' : 'no'}`}>
        <div>
          <span className="verdict-label">Justified</span>
          <strong>{assessment.justified ? 'Yes' : 'No'}</strong>
        </div>
        <span className="verdict-detail">{assessment.verdict.replace(/_/g, ' ').toLowerCase()}</span>
      </div>

      <div className="scores">
        <Score
          title="Evidence strength"
          value={`${assessment.evidenceStrength} / 100`}
          note="Calculated from the study design: sample size, control arm, significance, method."
        />
        <Score
          title="Model confidence"
          value={assessment.modelConfidence.toFixed(2)}
          note="The model's own estimate of its extraction. Not a statistical probability."
        />
      </div>

      <h2>Reasoning</h2>
      <p>{assessment.reasoning}</p>

      {assessment.suggestedClaim && (
        <div className="suggestion">
          <h3>Wording this evidence would support</h3>
          <p>{assessment.suggestedClaim}</p>
        </div>
      )}

      <h2>Checks</h2>
      <ul className="findings">
        {assessment.findings.map((finding) => (
          <Finding key={finding.id} finding={finding} />
        ))}
      </ul>

      {assessment.studyFacts.citations.length > 0 && (
        <>
          <h2>Extracted from the evidence</h2>
          <ul className="citations">
            {assessment.studyFacts.citations.map((citation) => (
              <li key={citation.field}>
                <span className="field">{citation.field}</span>
                <q>{citation.quote}</q>
              </li>
            ))}
          </ul>
        </>
      )}

      <footer className="provenance">
        model {assessment.provenance.modelId} &middot; prompt {assessment.provenance.promptVersion}{' '}
        &middot; rules {assessment.provenance.rulesVersion} &middot; evidence{' '}
        {assessment.provenance.evidenceHash.slice(0, 12)} &middot; assessment {assessment.id}
      </footer>
    </section>
  );
}

function Score({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="score">
      <span className="score-title">{title}</span>
      <strong>{value}</strong>
      <span className="score-note">{note}</span>
    </div>
  );
}

function Finding({ finding }: { finding: RuleFinding }) {
  return (
    <li className={`finding ${finding.status.toLowerCase()}`}>
      <span className="status">{finding.status}</span>
      <div>
        <strong>{finding.label}</strong>
        <p>{finding.detail}</p>
      </div>
    </li>
  );
}
