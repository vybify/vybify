import type { APIRoute } from 'astro';

const SKILL_SIGNALS = [
  'mcp-server', 'mcp server', 'claude-code', 'claude code skill',
  'cursor-rule', 'cursor rule', 'custom-gpt', 'custom gpt',
  '.cursorrules', 'CLAUDE.md', 'skills/', 'mcp_server',
];

const AI_TOOL_KEYWORDS: Record<string, string> = {
  '@anthropic-ai/sdk': 'Claude API',
  'anthropic': 'Claude API',
  '@ai-sdk': 'Vercel AI SDK',
  'openai': 'OpenAI',
  'langchain': 'LangChain',
  'llamaindex': 'LlamaIndex',
  'replicate': 'Replicate',
  '@huggingface': 'Hugging Face',
  'transformers': 'Hugging Face',
  'ollama': 'Ollama',
  'groq': 'Groq',
  'cohere': 'Cohere',
  'cursor': 'Cursor',
  'copilot': 'GitHub Copilot',
  'firecrawl': 'Firecrawl',
  '@supabase': 'Supabase',
  'next': 'Next.js',
  'astro': 'Astro',
  'svelte': 'SvelteKit',
  'remotion': 'Remotion',
};

function extractInstallCommand(readme: string): string | null {
  // Look for code blocks after install/setup/getting-started headings
  const installSection = readme.match(
    /#{1,3}\s*(?:install|setup|getting\s*started|quick\s*start|usage)\s*\n([\s\S]*?)(?=\n#{1,3}\s|\n$)/i,
  );
  const searchIn = installSection ? installSection[1] : readme;

  // Match code blocks containing install-like commands
  const codeBlocks = [...searchIn.matchAll(/```[\w]*\n([\s\S]*?)```/g)];
  for (const block of codeBlocks) {
    const code = block[1].trim();
    const lines = code.split('\n');
    for (const line of lines) {
      const clean = line.replace(/^\$\s*/, '').trim();
      if (
        /^(npm\s+(install|i|add)|npx\s|yarn\s+add|pnpm\s+(add|install)|pip\s+install|brew\s+install|cargo\s+install|go\s+install|claude\s+install)/i.test(clean)
      ) {
        return clean;
      }
    }
  }

  // Inline code with install commands
  const inlineInstall = readme.match(
    /`((?:npm\s+(?:install|i|add)|npx|yarn\s+add|pnpm\s+(?:add|install)|pip\s+install|brew\s+install|cargo\s+install|go\s+install|claude\s+install)\s+[^`]+)`/i,
  );
  if (inlineInstall) return inlineInstall[1].trim();

  return null;
}

function detectKind(readme: string, topics: string[]): string | null {
  const text = (readme + ' ' + topics.join(' ')).toLowerCase();
  if (text.includes('mcp-server') || text.includes('mcp server') || text.includes('model context protocol')) return 'mcp-server';
  if (text.includes('claude-code') || text.includes('claude code skill') || /skills?\//.test(text)) return 'claude-code-skill';
  if (text.includes('cursor-rule') || text.includes('cursorrule') || text.includes('.cursorrules')) return 'cursor-rule';
  if (text.includes('custom-gpt') || text.includes('custom gpt') || text.includes('gpt action')) return 'custom-gpt';
  return null;
}

function detectType(readme: string, topics: string[]): 'skill' | 'project' {
  const text = (readme + ' ' + topics.join(' ')).toLowerCase();
  for (const signal of SKILL_SIGNALS) {
    if (text.includes(signal.toLowerCase())) return 'skill';
  }
  return 'project';
}

function extractBuiltWith(deps: Record<string, string>): string[] {
  const found = new Set<string>();
  for (const dep of Object.keys(deps)) {
    const depLower = dep.toLowerCase();
    for (const [keyword, label] of Object.entries(AI_TOOL_KEYWORDS)) {
      if (depLower.includes(keyword.toLowerCase())) {
        found.add(label);
      }
    }
  }
  return [...found];
}

function extractReadmeBody(readme: string): string {
  let body = readme;

  // Strip badges (image links at the very top)
  body = body.replace(/^\s*(\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)\s*)+/gm, '');
  // Strip the first H1 (title)
  body = body.replace(/^#\s+.+\n*/m, '');
  // Strip badge images
  body = body.replace(/!\[[^\]]*\]\(https:\/\/img\.shields\.io[^)]*\)/g, '');
  body = body.replace(/!\[[^\]]*\]\(https:\/\/badge[^)]*\)/g, '');

  // Take content up to a reasonable length — first ~2000 chars or up to
  // a "License" / "Contributing" / "Credits" heading
  const cutoff = body.search(/\n#{1,3}\s*(licen[sc]e|contributing|credits|acknowledgements|changelog)\b/i);
  if (cutoff > 0) body = body.slice(0, cutoff);

  return body.trim().slice(0, 2000);
}

async function ghFetch(path: string, headers: Record<string, string>): Promise<any | null> {
  try {
    const res = await fetch(`https://api.github.com${path}`, { headers });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const GET: APIRoute = async ({ url, locals }) => {
  const repo = url.searchParams.get('repo');
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return new Response(JSON.stringify({ error: 'Invalid repo format. Use owner/repo.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'vybify',
  };
  const runtime = (locals as any).runtime;
  const token = runtime?.env?.GITHUB_TOKEN ?? import.meta.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  // Fetch repo metadata, README, and package.json in parallel
  const [repoRes, readmeData, pkgData] = await Promise.all([
    fetch(`https://api.github.com/repos/${repo}`, { headers }),
    ghFetch(`/repos/${repo}/readme`, headers),
    ghFetch(`/repos/${repo}/contents/package.json`, headers),
  ]);

  if (!repoRes.ok) {
    const body = await repoRes.text();
    let msg = `GitHub API returned ${repoRes.status}`;
    try { msg = JSON.parse(body).message || msg; } catch {}
    return new Response(JSON.stringify({ error: msg }), {
      status: repoRes.status === 404 ? 404 : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await repoRes.json();

  // Decode README
  let readme = '';
  if (readmeData?.content) {
    try { readme = atob(readmeData.content.replace(/\n/g, '')); } catch {}
  }

  // Decode package.json
  let pkg: any = {};
  if (pkgData?.content) {
    try { pkg = JSON.parse(atob(pkgData.content.replace(/\n/g, ''))); } catch {}
  }

  const topics = data.topics ?? [];
  const inferredType = detectType(readme, topics);
  const kind = inferredType === 'skill' ? (detectKind(readme, topics) || 'other') : null;
  const install = extractInstallCommand(readme);
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const builtWith = extractBuiltWith(allDeps);
  const body = readme ? extractReadmeBody(readme) : (data.description ?? '');

  // Build a good tagline: repo description, capped at 160
  let tagline = data.description ?? '';
  if (tagline.length > 160) tagline = tagline.slice(0, 157) + '...';

  return new Response(JSON.stringify({
    name: pkg.name || data.name,
    description: data.description ?? '',
    tagline,
    homepage: data.homepage ?? '',
    topics,
    language: data.language ?? '',
    owner: data.owner?.login ?? '',
    html_url: data.html_url,
    // Enhanced fields
    inferredType,
    kind,
    install,
    builtWith,
    body,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
