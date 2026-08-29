import process from 'node:process';
import { initSchema } from '../server/src/db.js';
import { seed } from '../server/src/seed.js';
import { createApp } from '../server/src/app.js';

initSchema();
await seed();

const app = createApp();

export default app;
