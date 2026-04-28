import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const CACHE_PATH = resolve(process.cwd(), '.cache/github-stars.json');
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

type CacheShape = Record<string, { stars: number | null; fetchedAt: number }>;

let memoryCache: CacheShape | null = null;

async function loadCache(): Promise<CacheShape> {
  if (memoryCache) return memoryCache;
  if (!existsSync(CACHE_PATH)) {
    memoryCache = {};
    return memoryCache;
  }
  try {
    memoryCache = JSON.parse(await readFile(CACHE_PATH, 'utf8')) as CacheShape;
  } catch {
    memoryCache = {};
  }
  return memoryCache;
}

async function saveCache(cache: CacheShape): Promise<void> {
  await mkdir(dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
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

export async function getStars(repo: string | undefined): Promise<number | null> {
  if (!repo) return null;
  const cache = await loadCache();
  const cached = cache[repo];
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.stars;
  }
  const live = await fetchStarsLive(repo);
  cache[repo] = { stars: live, fetchedAt: now };
  await saveCache(cache);
  return live;
}

export async function withStars<T extends { data: { github?: string } }>(
  entries: T[],
): Promise<Array<T & { stars: number | null }>> {
  const results = await Promise.all(
    entries.map(async (entry) => ({
      ...entry,
      stars: await getStars(entry.data.github),
    })),
  );
  return results;
}

export function formatStars(n: number | null): string {
  if (n === null) return '—';
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
