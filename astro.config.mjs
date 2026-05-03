import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: 'https://vybify.com',
  integrations: [mdx()],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare()
});