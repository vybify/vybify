import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { withStars } from '../../../lib/github';
import { generateOgImage } from '../../../lib/og';

export const getStaticPaths: GetStaticPaths = async () => {
  const projects = await withStars(await getCollection('projects'));
  return projects.map((e) => ({ params: { slug: e.id }, props: { entry: e } }));
};

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as any;
  const { data, stars } = entry;

  const png = await generateOgImage({
    name: data.name,
    tagline: data.tagline,
    type: 'Project',
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
