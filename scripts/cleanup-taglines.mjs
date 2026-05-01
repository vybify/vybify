#!/usr/bin/env node
/**
 * Clean up skill taglines:
 *  - Re-fetch the full SKILL.md description (not the truncated version
 *    we previously stored)
 *  - Smart-truncate to 160 chars at sentence/word boundary instead of
 *    mid-word
 *  - For obvious fallback garbage (paths, repo descriptions that became
 *    monorepo path strings), replace with cleaner derivations
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dir = 'src/content/skills';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FETCH_DELAY_MS = 60;

const TOKEN = process.env.GITHUB_TOKEN;

const MAX_LEN = 160;

function smartTruncate(text, max = MAX_LEN) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;

  const slice = cleaned.slice(0, max);

  // Prefer breaking at end of sentence
  const sentenceEnd = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
  );
  if (sentenceEnd > max * 0.5) {
    return slice.slice(0, sentenceEnd + 1).trim();
  }

  // Otherwise word boundary
  const wordBoundary = slice.lastIndexOf(' ');
  if (wordBoundary > max * 0.4) {
    return slice.slice(0, wordBoundary).replace(/[,;:]+$/, '').trim() + '…';
  }

  // Fallback hard cut
  return slice.replace(/[,;:]+$/, '').trim() + '…';
}

function isGarbage(tagline) {
  if (!tagline || tagline === '>-') return true;
  if (tagline.length < 15) return true;
  // Looks like a file path
  if (/^[a-zA-Z0-9_\-/]+\.(md|txt|rst|json)$/.test(tagline)) return true;
  if (/^packages\//.test(tagline) || /^src\//.test(tagline)) return true;
  return false;
}

function isMidWordTruncation(tagline) {
  if (tagline.length < 158) return false;
  // Properly-terminated taglines end with sentence punctuation or ellipsis
  // (Latin or CJK). Anything else at this length suggests a truncation.
  const trimmed = tagline.trim();
  return !/[.!?…。！？]$/.test(trimmed);
}

function parseSkillsShUrl(url) {
  if (!url || !url.startsWith('https://skills.sh/')) return null;
  const parts = url.replace('https://skills.sh/', '').split('/').filter(Boolean);
  if (parts.length !== 3) return null;
  return { owner: parts[0], repo: parts[1], skill: parts[2] };
}

function parseFrontmatterMd(md) {
  const m = md.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return null;
  const out = {};
  let currentKey = null;
  let buf = [];
  for (const rawLine of m[1].split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) {
      if (currentKey !== null && buf.length) {
        out[currentKey] = buf.join(' ').trim();
        buf = [];
      }
      const [, key, valRaw] = kv;
      const val = valRaw.trim().replace(/^["']|["']$/g, '');
      if (val === '' || val === '|' || val === '>' || val === '>-') {
        currentKey = key;
      } else {
        out[key] = val;
        currentKey = null;
      }
    } else if (currentKey !== null && line.trim()) {
      buf.push(line.trim());
    }
  }
  if (currentKey !== null && buf.length) {
    out[currentKey] = buf.join(' ').trim();
  }
  return out;
}

async function fetchRepo(repo) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'vybify-cleanup',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      description: data.description,
      defaultBranch: data.default_branch ?? 'main',
    };
  } catch {
    return null;
  }
}

const repoCache = new Map();
async function getRepo(repo) {
  if (!repoCache.has(repo)) repoCache.set(repo, await fetchRepo(repo));
  return repoCache.get(repo);
}

async function fetchSkillDescription(owner, repo, skill, branch) {
  const candidatePaths = [
    `${skill}/SKILL.md`,
    `skills/${skill}/SKILL.md`,
    `agent-skills/${skill}/SKILL.md`,
    `plugins/${skill}/SKILL.md`,
    `superpowers/${skill}/SKILL.md`,
    `superpowers/skills/${skill}/SKILL.md`,
    `SKILL.md`,
  ];
  for (const path of candidatePaths) {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'vybify-cleanup' } });
      if (!res.ok) continue;
      const md = await res.text();
      const fm = parseFrontmatterMd(md);
      if (fm?.description) return fm.description.trim();
    } catch {}
  }
  return null;
}

function escapeYaml(value) {
  if (typeof value !== 'string') return JSON.stringify(value);
  if (/[:#&*!|>'"%@`,{}[\]?\-]/.test(value) || /^\s|\s$/.test(value) || /^(true|false|null|yes|no)$/i.test(value)) {
    return JSON.stringify(value);
  }
  return value;
}

/**
 * Replace just the tagline line in the frontmatter without disturbing
 * anything else.
 */
function replaceTagline(content, newTagline) {
  // Match the tagline field (single-line or block-scalar form)
  const re = /^(tagline:)([ \t]*)([>|][\-+]?[ \t]*)?(.*?)(?=\n[\w-]+:|\n---)/ms;
  return content.replace(re, `tagline: ${escapeYaml(newTagline)}`);
}

async function main() {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md'));

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const f of files) {
    const filePath = join(dir, f);
    const content = await readFile(filePath, 'utf8');

    // Extract frontmatter values
    const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      skipped++;
      continue;
    }
    const fm = parseFrontmatterMd(content) ?? {};
    const currentTagline = fm.tagline ?? '';
    const url = fm.url ?? '';
    const github = fm.github ?? '';

    const garbage = isGarbage(currentTagline);
    const truncated = isMidWordTruncation(currentTagline);
    if (!garbage && !truncated) {
      skipped++;
      continue;
    }

    let newTagline = null;

    // Try to re-fetch the full SKILL.md description
    const ref = parseSkillsShUrl(url);
    if (ref && github) {
      const repoInfo = await getRepo(github);
      const branch = repoInfo?.defaultBranch ?? 'main';
      const desc = await fetchSkillDescription(ref.owner, ref.repo, ref.skill, branch);
      if (desc) newTagline = desc;
      await sleep(FETCH_DELAY_MS);
    }

    // Fallback: GitHub repo description
    if (!newTagline && github) {
      const repoInfo = await getRepo(github);
      if (repoInfo?.description && !isGarbage(repoInfo.description)) {
        newTagline = repoInfo.description;
      }
    }

    // Last resort: just smart-truncate the existing tagline (fixes
    // mid-word cuts even when we can't fetch a fresh source)
    if (!newTagline && truncated) {
      newTagline = currentTagline;
    }

    if (!newTagline) {
      console.log(`[skip] ${f}: no replacement found`);
      failed++;
      continue;
    }

    const cleanTagline = smartTruncate(newTagline, MAX_LEN);
    if (cleanTagline === currentTagline) {
      skipped++;
      continue;
    }

    const newContent = replaceTagline(content, cleanTagline);
    await writeFile(filePath, newContent);
    updated++;
    if (updated % 20 === 0) {
      console.log(`  updated ${updated} so far...`);
    }
  }

  console.log(`\nDone. Updated ${updated}. Skipped ${skipped}. Failed ${failed}.`);
}

main().catch((err) => {
  console.error('[cleanup] fatal:', err);
  process.exit(1);
});
