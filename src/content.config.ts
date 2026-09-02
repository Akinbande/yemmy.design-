import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const work = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    org: z.string(),
    year: z.string(),
    tier: z.number().int().min(1).max(3),
    order: z.number().int(),
    status: z.enum(['live', 'early-access', 'shipped', 'concept']),
    summary: z.string(),
    tags: z.array(z.string()),
    link: z.string().url().optional(),
    keywords: z.array(z.string()).default([]),
  }),
});

export const collections = { work };
