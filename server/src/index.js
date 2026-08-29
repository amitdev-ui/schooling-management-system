import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initSchema } from './db.js';
import { seed } from './seed.js';
import { createApp } from './app.js';

initSchema();
await seed();

const app = createApp();

// Serve the built React client (single-service / local deployment)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
} else {
  console.log('client/dist not found - serving API only');
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SMS API running on http://localhost:${PORT}`);
});
