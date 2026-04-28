import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const CACHE_PATH = resolve(process.cwd(), '.cache/github-stars.json');
const HISTORY_PATH = resolve(process.cwd(), '.cache/github-history.json');
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const HISTORY_DAYS = 14;

type CacheShape = Record<string, { stars: number | null; fetchedAt: number }>;
type HistoryEntry = { date: string; stars: number };
type HistoryShape = Record<string, HistoryEntry[]>;

let memoryCache: CacheShape | null = null;
let memoryHistory: HistoryShape | null = null;

const today = () => new Date().toISOString().slice(0, 10);

async function loadJson<T>(path: string, fallback: T): Promise<T> {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

async function loadCache(): Promise<CacheShape> {
  if (!memoryCache) memoryCache = await loadJson<CacheShape>(CACHE_PATH, {});
  return memoryCache;
}

async function loadHistory(): Promise<HistoryShape> {
  if (!memoryHistory) memoryHistory = await loadJson<HistoryShape>(HISTORY_PATH, {});
  return memoryHistory;
}

async function save(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2));
}

function recordHistory(history: HistoryShape, repo: string, stars: number): void {
  const list = history[repo] ?? (history[repo] = []);
  const todayStr = today();
  const existing = list.find((e) => e.date === todayStr);
  if (existing) {
    existing.stars = stars;
  } else {
    list.push({ date: todayStr, stars });
  }
  // Trim entries older than HISTORY_DAYS
  const cutoff = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString().slice(0, 10);
  history[repo] = list.filter((e) => e.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
}

function compute7dDelta(history: HistoryEntry[] | undefined, currentStars: number | null): number | null {
  if (currentStars === null || !history || history.length === 0) return null;
  const target = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  // Pick the oldest entry on or after the target date — that approximates "7 days ago"
  const reference = history.find((e) => e.date >= target) ?? history[0];
  if (!reference) return null;
  return currentStars - reference.stars;
}

async function fetchStarsLive(repo: string): Promise<number | null> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'vybify-build',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (!res.ok) {
      console.warn(`[github] ${repo} → ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch (err) {
    console.warn(`[github] ${repo} fetch failed`, err);
    return null;
  }
}

export type StarSnapshot = {
  stars: number | null;
  delta7d: number | null;
};

export async function getStarSnapshot(repo: string | undefined): Promise<StarSnapshot> {
  if (!repo) return { stars: null, delta7d: null };
  const cache = await loadCache();
  const history = await loadHistory();
  const now = Date.now();
  const cached = cache[repo];

  let stars = cached?.stars ?? null;
  if (!cached || now - cached.fetchedAt >= CACHE_TTL_MS) {
    stars = await fetchStarsLive(repo);
    cache[repo] = { stars, fetchedAt: now };
    await save(CACHE_PATH, cache);
  }

  if (stars !== null) {
    recordHistory(history, repo, stars);
    await save(HISTORY_PATH, history);
  }

  return { stars, delta7d: compute7dDelta(history[repo], stars) };
}

export async function withStars<T extends { data: { github?: string } }>(
  entries: T[],
): Promise<Array<T & StarSnapshot>> {
  const results = await Promise.all(
    entries.map(async (entry) => ({ ...entry, ...(await getStarSnapshot(entry.data.github)) })),
  );
  return results;
}

export function formatStars(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function formatDelta(n: number | null): string {
  if (n === null || n === 0) return '';
  const sign = n > 0 ? '+' : '';
  if (Math.abs(n) >= 1000) return `${sign}${(n / 1000).toFixed(1)}k`;
  return `${sign}${n}`;
}
