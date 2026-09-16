import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://yemmy.design',
  integrations: [mdx()],
  // every page stays prerendered; the adapter only exists so /api/contact can run on demand as a Vercel function
  adapter: vercel(),
  build: { inlineStylesheets: 'auto' },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three';
            if (id.includes('node_modules/gsap')) return 'gsap';
          },
        },
      },
    },
  },
});
