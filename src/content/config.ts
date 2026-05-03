import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const baseEntry = z.object({
  name: z.string(),
  tagline: z.string().max(160),
  url: z.string().url(),
  github: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  starter: z.boolean().default(false),
  addedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: baseEntry.extend({
    builtWith: z.array(z.string()).default([]),
  }),
});

const skills = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/skills' }),
  schema: baseEntry.extend({
    kind: z.enum(['claude-code-skill', 'mcp-server', 'cursor-rule', 'custom-gpt', 'other']),
    install: z.string().optional(),
  }),
});

export const collections = { projects, skills };
