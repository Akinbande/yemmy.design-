import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://yemmy.design',
  integrations: [mdx()],
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
