#!/usr/bin/env node
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error('GITHUB_TOKEN is required');
  process.exit(1);
}

const MIN_STARS = 100;
const MAX_AGE_DAYS = 90;
const PER_TOPIC = 10;
const MAX_OUTPUT = 25;

const PROJECT_TOPICS = [
  'ai-coding-assistant',
  'coding-agent',
  'ai-agent',
  'autonomous-agents',
  'vibe-coding',
  'llm-agent',
  'ai-pair-programming',
];

const SKILL_TOPICS = [
  'claude-code',
  'mcp-server',
  'mcp',
  'cursor-rules',
  'agent-rules',
];

async function searchTopic(topic) {
  const since = new Date(Date.now() - MAX_AGE_DAYS * 86400000).toISOString().slice(0, 10);
  const q = encodeURIComponent(`topic:${topic} stars:>=${MIN_STARS} created:>${since}`);
  const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=${PER_TOPIC}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'User-Agent': 'vybify-discover',
      Accept: 'application/vnd.github+json',
    },
  });
  if (!res.ok) {
    console.warn(`[discover] ${topic} → ${res.status}`);
    return [];
  }
  const data = await res.json();
  return data.items ?? [];
}

async function loadExistingGithubs() {
  const dirs = ['src/content/projects', 'src/content/skills'];
  const existing = new Set();
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of await readdir(dir)) {
      if (!f.endsWith('.json')) continue;
      try {
        const data = JSON.parse(await readFile(join(dir, f), 'utf8'));
        if (data.github) existing.add(data.github.toLowerCase());
      } catch {}
    }
  }
  return existing;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function classifyKind(repo) {
  const topics = (repo.topics ?? []).map((t) => t.toLowerCase());
  if (topics.some((t) => t.includes('mcp'))) return 'mcp-server';
  if (topics.some((t) => t.includes('cursor'))) return 'cursor-rule';
  if (topics.some((t) => t.includes('claude-code'))) return 'claude-code-skill';
  return 'other';
}

function buildEntry(repo, isSkill) {
  const today = new Date().toISOString().slice(0, 10);
  const tags = (repo.topics ?? []).slice(0, 5);
  const base = {
    name: repo.name,
    tagline: (repo.description ?? 'No description provided.').slice(0, 160),
    url: repo.homepage || repo.html_url,
    github: repo.full_name,
    author: repo.owner.login,
    tags,
    addedAt: today,
  };
  return isSkill
    ? { ...base, kind: classifyKind(repo) }
    : { ...base, builtWith: [] };
}

const main = async () => {
  const existing = await loadExistingGithubs();
  const projects = new Map();
  const skills = new Map();

  for (const topic of PROJECT_TOPICS) {
    for (const r of await searchTopic(topic)) {
      const key = r.full_name.toLowerCase();
      if (existing.has(key) || projects.has(key)) continue;
      projects.set(key, r);
    }
  }

  for (const topic of SKILL_TOPICS) {
    for (const r of await searchTopic(topic)) {
      const key = r.full_name.toLowerCase();
      if (existing.has(key)) continue;
      // Reclassify as skill if a skill topic also matched
      if (projects.has(key)) projects.delete(key);
      if (skills.has(key)) continue;
      skills.set(key, r);
    }
  }

  // Combine and cap by star count
  const all = [
    ...[...projects.values()].map((r) => ({ repo: r, isSkill: false })),
    ...[...skills.values()].map((r) => ({ repo: r, isSkill: true })),
  ];
  all.sort((a, b) => (b.repo.stargazers_count ?? 0) - (a.repo.stargazers_count ?? 0));
  const top = all.slice(0, MAX_OUTPUT);

  await mkdir('src/content/candidates/projects', { recursive: true });
  await mkdir('src/content/candidates/skills', { recursive: true });

  let pCount = 0, sCount = 0;
  for (const { repo, isSkill } of top) {
    const dir = isSkill ? 'skills' : 'projects';
    const f = `src/content/candidates/${dir}/${slug(repo.name)}.json`;
    await writeFile(f, JSON.stringify(buildEntry(repo, isSkill), null, 2) + '\n');
    isSkill ? sCount++ : pCount++;
  }

  console.log(`Wrote top ${top.length} of ${all.length} candidates (${pCount} projects, ${sCount} skills).`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
