import type { APIRoute } from 'astro';

const ADMIN_EMAILS = ['jake@drinkpsilly.com', 'charlie.mellman@gmail.com'];
const REPO = 'vybify/vybify';

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function escapeYaml(value: string): string {
  if (/[:#&*!|>'"@`,{}[\]?\-\\]/.test(value) || /^\s|\s$/.test(value) || /^(true|false|null|yes|no)$/i.test(value)) {
    return JSON.stringify(value);
  }
  return value;
}

function buildFileContent(entry: any): string {
  const lines: string[] = ['---'];
  lines.push(`name: ${escapeYaml(entry.name)}`);
  lines.push(`tagline: ${escapeYaml(entry.tagline)}`);
  lines.push(`url: ${escapeYaml(entry.url)}`);
  if (entry.github) lines.push(`github: ${escapeYaml(entry.github)}`);
  if (entry.author) lines.push(`author: ${escapeYaml(entry.author)}`);
  if (entry.featured) lines.push(`featured: true`);

  if (entry.type === 'skill' && entry.kind) {
    lines.push(`kind: ${escapeYaml(entry.kind)}`);
  }
  if (entry.type === 'skill' && entry.install) {
    lines.push(`install: ${escapeYaml(entry.install)}`);
  }

  // Tags
  if (entry.tags?.length) {
    lines.push('tags:');
    for (const tag of entry.tags) lines.push(`  - ${escapeYaml(tag)}`);
  } else {
    lines.push('tags: []');
  }

  if (entry.type === 'project' && entry.builtWith?.length) {
    lines.push('builtWith:');
    for (const bw of entry.builtWith) lines.push(`  - ${escapeYaml(bw)}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  lines.push(`addedAt: "${today}"`);
  lines.push('---');

  if (entry.body?.trim()) {
    lines.push('');
    lines.push(entry.body.trim());
  }

  lines.push('');
  return lines.join('\n');
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const runtime = (locals as any).runtime;
  const token = runtime?.env?.GITHUB_TOKEN ?? import.meta.env.GITHUB_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const entries = await request.json();
  if (!Array.isArray(entries) || entries.length === 0) {
    return new Response(JSON.stringify({ error: 'No entries provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results: { name: string; path: string; ok: boolean; error?: string }[] = [];

  for (const entry of entries) {
    const dir = entry.type === 'skill' ? 'src/content/skills' : 'src/content/projects';
    const fname = slug(entry.name) + '.md';
    const path = `${dir}/${fname}`;
    const content = buildFileContent(entry);

    try {
      // Check if file already exists
      const checkRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'vybify-ingest',
        },
      });

      if (checkRes.ok) {
        results.push({ name: entry.name, path, ok: false, error: 'File already exists' });
        continue;
      }

      // Create file
      const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'vybify-ingest',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Add ${entry.type}: ${entry.name}`,
          content: btoa(unescape(encodeURIComponent(content))),
          branch: 'main',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        results.push({ name: entry.name, path, ok: false, error: err.message || `HTTP ${res.status}` });
      } else {
        results.push({ name: entry.name, path, ok: true });
      }
    } catch (err: any) {
      results.push({ name: entry.name, path, ok: false, error: err.message });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
