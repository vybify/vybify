#!/usr/bin/env node
/**
 * Prefetch GitHub stars for every entry BEFORE Astro builds. Astro builds
 * pages in parallel and there's no good place to globally cap concurrency
 * from inside its build lifecycle. Doing the fetch up-front sidesteps that
 * entirely — by the time Astro starts, .cache/github-stars.json is full
 * and getStarSnapshot just reads from it.
 *
 * Strategy: walk all JSON entries, collect unique github repos, fetch each
 * one sequentially with a small delay. Slow but reliable; ~80 repos × 100ms
 * = ~8s total, well under any rate limit.
 */
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const CACHE_PATH = resolve(process.cwd(), '.cache/github-stars.json');
const HISTORY_PATH = resolve(process.cwd(), '.cache/github-history.json');
const HISTORY_DAYS = 14;
const REQUEST_DELAY_MS = 800;
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 2;

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.warn('[prefetch] GITHUB_TOKEN not set; rate limits will be tight.');
} else {
  console.log(`[prefetch] GITHUB_TOKEN is set (${TOKEN.length} chars, starts with ${TOKEN.slice(0, 4)}...)`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);

async function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

async function save(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2));
}

function parseYamlFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const yaml = match[1];
  // Simple extraction — just need the github field
  const ghMatch = yaml.match(/^github:\s*['"]?([^\s'"#]+)/m);
  return ghMatch ? { github: ghMatch[1] } : {};
}

async function collectUniqueRepos() {
  const dirs = ['src/content/projects', 'src/content/skills'];
  const repos = new Set();
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of await readdir(dir)) {
      try {
        const raw = await readFile(join(dir, f), 'utf8');
        let d;
        if (f.endsWith('.json')) {
          d = JSON.parse(raw);
        } else if (f.endsWith('.md') || f.endsWith('.mdx')) {
          d = parseYamlFrontmatter(raw);
        } else {
          continue;
        }
        if (d.github) repos.add(d.github);
      } catch {}
    }
  }
  return [...repos];
}

async function fetchStars(repo, attempt = 0) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'vybify-prefetch',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (res.status === 403 || res.status === 429) {
      // Rate limit hit — back off and retry
      const retryAfter = parseInt(res.headers.get('retry-after') || '0', 10) * 1000;
      const waitMs = retryAfter || (RETRY_DELAY_MS * (attempt + 1));
      if (attempt < MAX_RETRIES) {
        console.warn(`[prefetch] ${repo} → ${res.status}; retry in ${waitMs}ms`);
        await sleep(waitMs);
        return fetchStars(repo, attempt + 1);
      }
      console.warn(`[prefetch] ${repo} → ${res.status} after ${MAX_RETRIES} retries`);
      return null;
    }
    if (!res.ok) {
      console.warn(`[prefetch] ${repo} → ${res.status}`);
      return null;
    }
    const data = await res.json();
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch (err) {
    console.warn(`[prefetch] ${repo} fetch failed:`, err.message);
    return null;
  }
}

function recordHistory(history, repo, stars) {
  if (stars === null) return;
  const list = history[repo] ?? (history[repo] = []);
  const todayStr = today();
  const existing = list.find((e) => e.date === todayStr);
  if (existing) {
    existing.stars = stars;
  } else {
    list.push({ date: todayStr, stars });
  }
  const cutoff = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString().slice(0, 10);
  history[repo] = list
    .filter((e) => e.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function main() {
  console.log(`[prefetch] cwd: ${process.cwd()}`);
  console.log(`[prefetch] cache path: ${CACHE_PATH}`);
  const repos = await collectUniqueRepos();
  console.log(`[prefetch] ${repos.length} unique repos`);
  if (repos.length > 0) console.log(`[prefetch] first 3: ${repos.slice(0, 3).join(', ')}`);

  const cache = await loadJson(CACHE_PATH, {});
  const history = await loadJson(HISTORY_PATH, {});

  const now = Date.now();
  let fetched = 0;
  let cached = 0;
  let failed = 0;

  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
    const existing = cache[repo];
    // Skip only if we have a SUCCESSFUL recent value. Never lock in nulls
    // — failed fetches must be retried on subsequent builds.
    if (existing && existing.stars !== null && now - existing.fetchedAt < 1000 * 60 * 60 * 6) {
      cached++;
      continue;
    }

    const stars = await fetchStars(repo);
    if (stars !== null) {
      cache[repo] = { stars, fetchedAt: now };
      recordHistory(history, repo, stars);
      fetched++;
      if (fetched === 1) console.log(`[prefetch] first success: ${repo} → ${stars} stars`);
    } else {
      // Don't overwrite a previously-successful cached value with null
      if (!existing) cache[repo] = { stars: null, fetchedAt: now };
      failed++;
    }

    if ((i + 1) % 25 === 0) {
      console.log(`[prefetch] ${i + 1}/${repos.length} (fetched ${fetched}, cached ${cached}, failed ${failed})`);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  await save(CACHE_PATH, cache);
  await save(HISTORY_PATH, history);

  console.log(`[prefetch] Done. Fetched ${fetched}, cached ${cached}, failed ${failed}.`);
}

main().catch((err) => {
  console.error('[prefetch] fatal:', err);
  process.exit(1);
});
