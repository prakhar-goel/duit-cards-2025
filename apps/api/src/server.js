import { migrate, pool } from './db.js';
import { createApp } from './app.js';
import { recoverInterruptedJobs } from './ai-jobs.js';
const port = Number(process.env.PORT || 48152);
await migrate();
await recoverInterruptedJobs();
const server = createApp().listen(port, process.env.HOST || '0.0.0.0', () => console.log(`DUIT private-pilot API listening on port ${port}`));
let closing = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  if (closing) return;
  closing = true;
  server.close(() => pool.end().then(() => process.exit(0)));
  setTimeout(() => process.exit(0), 15000).unref();
});
