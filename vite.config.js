import { defineConfig } from 'vite';

// Relative base so the built site works from any folder or sub-path
// (GitHub Pages project sites, Netlify, an S3 bucket, a plain static host).
export default defineConfig({
  base: './',
  server: { port: 5173, host: '127.0.0.1' },
  preview: { port: 4173, host: '127.0.0.1' },
  build: { target: 'es2020', sourcemap: false },
});
