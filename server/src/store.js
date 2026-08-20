import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, '..', 'data');
const dataFile = process.env.URLS_FILE || path.join(dataDir, 'urls.json');
let urls = [];
let initPromise;
let writeQueue = Promise.resolve();

export async function initStore() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    try {
      const parsed = JSON.parse(await fs.readFile(dataFile, 'utf8'));
      if (!Array.isArray(parsed)) throw new Error('URL store must contain an array.');
      urls = parsed;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      urls = [];
      await persist();
    }
  })();

  try {
    await initPromise;
  } catch (error) {
    initPromise = undefined;
    throw error;
  }
}

function persist() {
  const operation = writeQueue.then(async () => {
    const temporaryFile = `${dataFile}.${process.pid}.${Date.now()}.tmp`;
    try {
      await fs.writeFile(temporaryFile, JSON.stringify(urls, null, 2), 'utf8');
      await fs.rename(temporaryFile, dataFile);
    } finally {
      await fs.rm(temporaryFile, { force: true });
    }
  });

  writeQueue = operation.catch(() => {});
  return operation;
}

export function listUrls() {
  return urls
    .map((url) => ({ ...url }))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}
export function findByCode(code) { return urls.find((url) => url.code === code); }

export async function createUrl(record) {
  if (!record || typeof record !== 'object' || typeof record.code !== 'string') {
    throw new TypeError('A URL record with a code is required.');
  }
  if (findByCode(record.code)) {
    const error = new Error('The short code already exists.');
    error.code = 'DUPLICATE_CODE';
    throw error;
  }

  urls.push({ ...record });
  await persist();
  return findByCode(record.code);
}

export async function incrementClicks(code) {
  const item = findByCode(code);
  if (!item) return undefined;

  item.clicks = Number.isSafeInteger(item.clicks) && item.clicks >= 0 ? item.clicks + 1 : 1;
  await persist();
  return item;
}
