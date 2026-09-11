import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Case studies live as markdown in src/content/projects.
 * Each one opens as its own window on the desktop.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    year: z.number(),
    summary: z.string(),
    role: z.string(),
    stack: z.array(z.string()),
    url: z.string().url().optional(),
    cover: z.string(),            // /images/projects/xxx.webp, a 96px icon
    /* A wide shot for the top of the pane. `cover` is a 96px icon and cannot do this
       job. Optional, so a case study without one simply starts at its title. */
    banner: z.string().optional(),
    filename: z.string(),         // caption under the window, e.g. "compass-bio-labs.webflow"
    featured: z.boolean().default(false),
  }),
});

export const collections = { projects };
