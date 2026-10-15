import type { AssessmentResponse } from '@contract';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface AssessRequest {
  productName: string;
  claimWording: string;
  evidenceText: string;
  market: string;
}

export async function assessClaim(body: AssessRequest): Promise<AssessmentResponse> {
  const res = await fetch(`${BASE_URL}/api/claims/assess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }); 

  // fetch only rejects on network failure, so a 400 or 500 has to be checked here
  if (!res.ok) {
    const detail = await res
      .json()
      .then((payload) => payload?.message ?? payload?.detail)
      .catch(() => null);
    throw new Error(Array.isArray(detail) ? detail.join(', ') : (detail ?? `Request failed (${res.status})`));
  }

  return res.json();
}
