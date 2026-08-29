import { initSchema } from './db.js';
import { seed } from './seed.js';
import { createApp } from './app.js';

initSchema();
await seed();

const app = createApp();

export default app;
