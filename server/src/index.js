import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, validUrl } from './app.js';
import { initStore } from './store.js';

const port = Number(process.env.PORT || 5000);

export async function startServer() {
  await initStore();
  return app.listen(port, () => {
    console.log(`URL shortener API listening on http://localhost:${port}`);
  });
}

const isMainModule = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) await startServer();

export { app, validUrl };
