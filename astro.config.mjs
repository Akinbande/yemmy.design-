import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://yemmy.design',
  integrations: [mdx()],
  // every page stays prerendered; the adapter only exists so /api/contact can run on demand as a Vercel function
  adapter: vercel(),
  // Each page carries its CSS inside its HTML (about 35 KB, ~7 KB compressed). With linked stylesheets the client router
  // swapped the new page in before its CSS had loaded, so visitors saw the raw page for about a second on every click.
  build: { inlineStylesheets: 'always' },
  // A page starts loading when its link is hovered or tapped, so the click itself opens it at once.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
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
