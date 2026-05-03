import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { withStars } from '../../../lib/github';
import { generateOgImage } from '../../../lib/og';

const kindLabel: Record<string, string> = {
  'claude-code-skill': 'Skill',
  'mcp-server': 'MCP server',
  'cursor-rule': 'Cursor rules',
  'custom-gpt': 'Custom GPT',
  other: 'Skill',
};

export const getStaticPaths: GetStaticPaths = async () => {
  const skills = await withStars(await getCollection('skills'));
  return skills.map((e) => ({ params: { slug: e.id }, props: { entry: e } }));
};

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as any;
  const { data, stars } = entry;

  const png = await generateOgImage({
    name: data.name,
    tagline: data.tagline,
    type: kindLabel[data.kind] ?? 'Skill',
    stars,
    author: data.author,
    tags: data.tags,
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
