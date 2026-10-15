import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClaimAssessment } from './ClaimAssessment';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClaimAssessment />
  </StrictMode>,
);
