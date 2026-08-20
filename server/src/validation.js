const HTTP_PROTOCOLS = new Set(['http:', 'https:']);
const MAX_URL_LENGTH = 2048;
const CODE_PATTERN = /^[A-Za-z0-9_-]{6}$/;

export function validUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_URL_LENGTH) {
    return false;
  }

  try {
    const url = new URL(value);
    return HTTP_PROTOCOLS.has(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validCode(value) {
  return typeof value === 'string' && CODE_PATTERN.test(value);
}
