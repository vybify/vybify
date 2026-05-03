import type { APIRoute } from 'astro';

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

  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (!res.ok) {
    const body = await res.text();
    let msg = `GitHub API returned ${res.status}`;
    try { msg = JSON.parse(body).message || msg; } catch {}
    return new Response(JSON.stringify({ error: msg }), {
      status: res.status === 404 ? 404 : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await res.json();

  return new Response(JSON.stringify({
    name: data.name,
    description: data.description ?? '',
    homepage: data.homepage ?? '',
    topics: data.topics ?? [],
    language: data.language ?? '',
    owner: data.owner?.login ?? '',
    html_url: data.html_url,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
