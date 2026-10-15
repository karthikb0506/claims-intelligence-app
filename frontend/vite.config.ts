import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // the backend owns the API contract, the client imports it rather than
    // keeping its own copy that can drift
    alias: {
      '@contract': resolve(__dirname, '../backend/src/contract.ts'),
    },
  },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
  },
});
