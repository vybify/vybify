import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://vybify.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
