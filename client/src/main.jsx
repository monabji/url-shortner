import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : dateFormatter.format(date);
}

function shortUrlFor(code) {
  return `${API_BASE_URL}/${encodeURIComponent(code)}`;
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'The API could not complete that request.');
  }
  return data;
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand('copy');
  textArea.remove();

  if (!copied) {
    throw new Error('Copying is not available in this browser.');
  }
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false">
      <path d="M4 10h11m-5-5 5 5-5 5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M10 13.9 8.7 15.2a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0" />
      <path d="m14 10.1 1.3-1.3a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0" />
      <path d="m8.5 12 7-6m-7 6 7 6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <rect x="8" y="8" width="11" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function App() {
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [linksLoading, setLinksLoading] = useState(true);
  const [copiedValue, setCopiedValue] = useState('');
  const copyTimeout = useRef(null);

  const loadLinks = useCallback(async ({ showError = true } = {}) => {
    setLinksLoading(true);
    try {
      const data = await readResponse(await fetch(`${API_BASE_URL}/api/urls`));
      setLinks(Array.isArray(data.urls) ? data.urls : []);
      return true;
    } catch {
      if (showError) {
        setError('Could not connect to the API. Is the server running?');
      }
      return false;
    } finally {
      setLinksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
    return () => clearTimeout(copyTimeout.current);
  }, [loadLinks]);

  async function shorten(event) {
    event.preventDefault();
    const originalUrl = url.trim();
    setError('');
    setResult(null);
    setCopiedValue('');

    if (!originalUrl) {
      setError('Paste a URL to create a short link.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl }),
      });
      const data = await readResponse(response);
      setResult({ ...data, shortUrl: data.shortUrl || shortUrlFor(data.code) });
      setUrl('');
      await loadLinks({ showError: false });
    } catch (requestError) {
      setError(requestError.message || 'Could not create a short link.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(value) {
    try {
      await copyText(value);
      setCopiedValue(value);
      clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopiedValue(''), 1800);
    } catch (copyError) {
      setError(copyError.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="snip home">
          <span className="brand-mark"><ArrowIcon /></span>
          snip<span>.</span>
        </a>
        <a className="github-link" href="https://github.com" target="_blank" rel="noreferrer">
          GitHub <ArrowIcon />
        </a>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">LINKS, SIMPLIFIED</p>
        <h1 id="page-title">Short links.<br /><em>Big impact.</em></h1>
        <p className="intro">Turn long, unwieldy URLs into clean links that are easy to share, remember, and track.</p>

        <form onSubmit={shorten} className="shorten-form">
          <label className="sr-only" htmlFor="long-url">Long URL</label>
          <input
            id="long-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Paste your long URL here..."
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck="false"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Shorten URL'}
            <ArrowIcon />
          </button>
        </form>

        {error && <p className="error" role="alert">{error}</p>}

        {result && (
          <div className="result" aria-live="polite">
            <div className="result-copy">
              <small>YOUR SHORT LINK</small>
              <a href={result.shortUrl} target="_blank" rel="noreferrer">{result.shortUrl}</a>
            </div>
            <button type="button" onClick={() => handleCopy(result.shortUrl)}>
              {copiedValue === result.shortUrl ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        )}
      </section>

      <section className="links" aria-labelledby="recent-links-title">
        <div className="section-title">
          <h2 id="recent-links-title">Recent links</h2>
          <span>{links.length} total</span>
        </div>

        {linksLoading && links.length === 0 ? (
          <div className="empty" role="status">Loading your links…</div>
        ) : links.length === 0 ? (
          <div className="empty">Your shortened links will appear here.</div>
        ) : (
          <div className="table">
            {links.map((link) => {
              const shortUrl = shortUrlFor(link.code);
              return (
                <article className="link-row" key={link.code}>
                  <div className="link-icon"><LinkIcon /></div>
                  <div className="link-info">
                    <a href={shortUrl} target="_blank" rel="noreferrer">{shortUrl}</a>
                    <p title={link.originalUrl}>{link.originalUrl}</p>
                  </div>
                  <div className="stats">
                    <strong>{link.clicks ?? 0}</strong>
                    <small>clicks</small>
                  </div>
                  <time dateTime={link.createdAt}>{formatDate(link.createdAt)}</time>
                  <button
                    className="copy"
                    type="button"
                    onClick={() => handleCopy(shortUrl)}
                    aria-label={`Copy ${shortUrl}`}
                  >
                    {copiedValue === shortUrl ? 'Copied' : <CopyIcon />}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer>
        <span>© 2026 snip.</span>
        <span>Fast, simple, and free.</span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
