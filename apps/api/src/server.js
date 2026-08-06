import { migrate, pool } from "./db.js";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 4000);

await migrate();
const app = createApp();
const server = app.listen(port, () => console.log(`Duit API listening on http://localhost:${port}/api/v1`));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => pool.end(() => process.exit(0))));
}
