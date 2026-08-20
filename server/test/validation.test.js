import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = path.join(serverRoot, 'data', 'urls.json');

let apiUrl;
let serverProcess;
let originalData;
let dataFileExisted = false;

async function getAvailablePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const { port } = probe.address();
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForServer(processHandle) {
  const output = [];
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Server did not start. Output: ${output.join('')}`));
    }, 5_000);

    const finish = (error) => {
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve();
    };

    processHandle.stdout.on('data', (chunk) => {
      output.push(chunk.toString());
      if (output.join('').includes('URL shortener API listening')) finish();
    });
    processHandle.stderr.on('data', (chunk) => output.push(chunk.toString()));
    processHandle.once('error', finish);
    processHandle.once('exit', (code, signal) => {
      finish(new Error(`Server exited before startup (code ${code}, signal ${signal}). Output: ${output.join('')}`));
    });
  });
}

async function requestJson(route, options) {
  const response = await fetch(`${apiUrl}${route}`, options);
  return { response, body: await response.json() };
}

test.before(async () => {
  try {
    originalData = await fs.readFile(dataFile);
    dataFileExisted = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, '[]\n');

  const port = await getAvailablePort();
  apiUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, ['src/index.js'], {
    cwd: serverRoot,
    env: { ...process.env, PORT: String(port), BASE_URL: apiUrl, CLIENT_URL: apiUrl },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await waitForServer(serverProcess);
});

test.after(async () => {
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill();
    await Promise.race([
      once(serverProcess, 'exit'),
      new Promise((resolve) => setTimeout(resolve, 5_000))
    ]);
  }

  if (dataFileExisted) await fs.writeFile(dataFile, originalData);
  else await fs.rm(dataFile, { force: true });
});

test('reports service health', async () => {
  const { response, body } = await requestJson('/api/health');

  assert.equal(response.status, 200);
  assert.deepEqual(body, { status: 'ok' });
});

test('rejects missing, malformed, and non-HTTP(S) destinations', async () => {
  const invalidValues = [undefined, '', 'not a url', 'javascript:alert(1)', 'ftp://example.com'];

  for (const originalUrl of invalidValues) {
    const payload = originalUrl === undefined ? {} : { originalUrl };
    const { response, body } = await requestJson('/api/urls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(response.status, 400, `expected ${String(originalUrl)} to be rejected`);
    assert.equal(body.error, 'Enter a valid HTTP or HTTPS URL.');
  }
});

test('creates, lists, redirects, and counts a short URL', async () => {
  const create = await requestJson('/api/urls', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ originalUrl: ' https://example.com/docs?q=1 ' })
  });

  assert.equal(create.response.status, 201);
  assert.match(create.body.code, /^[A-Za-z0-9_-]{6}$/);
  assert.equal(create.body.originalUrl, 'https://example.com/docs?q=1');
  assert.equal(create.body.clicks, 0);
  assert.equal(create.body.shortUrl, `${apiUrl}/${create.body.code}`);

  const list = await requestJson('/api/urls');
  assert.equal(list.response.status, 200);
  assert.equal(list.body.urls.length, 1);
  assert.deepEqual(list.body.urls[0], {
    code: create.body.code,
    originalUrl: create.body.originalUrl,
    clicks: 0,
    createdAt: create.body.createdAt
  });

  const redirect = await fetch(`${apiUrl}/${create.body.code}`, { redirect: 'manual' });
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get('location'), create.body.originalUrl);

  const afterClick = await requestJson('/api/urls');
  assert.equal(afterClick.body.urls[0].clicks, 1);
});

test('returns not found for an unknown short code', async () => {
  const { response, body } = await requestJson('/missing-code');

  assert.equal(response.status, 404);
  assert.deepEqual(body, { error: 'Short URL not found.' });
});
