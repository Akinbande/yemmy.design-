# yemmy.design

Portfolio of **Oluwayemi Akinbande**, Senior Service & UX Designer specialising in
government-funded, regulated and citizen-facing digital services. Calgary, Canada.

[hello@yemmy.design](mailto:hello@yemmy.design) · [LinkedIn](https://www.linkedin.com/in/akinoluwayemi/)

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Astro 7, static output, MDX content collection for case studies |
| 3D | Three.js, one InstancedMesh scrubbed by scroll, lazy-loaded after first paint |
| Motion | GSAP ScrollTrigger and SplitText, Lenis for smooth scroll |
| Styling | Hand-written CSS on a token system, no framework |
| Fonts | Archivo Variable and IBM Plex Mono, self-hosted |

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

## Structure

```
src/
  content/work/       case studies as MDX, one file per project, tiered by relevance
  components/         sections of the home page, the nav, the scene
  scripts/scene.ts    the Three.js system scene
  scripts/motion.ts   Lenis, ScrollTrigger reveals, hero type
  scripts/menu.ts     top bar, layers panel, command palette
  pages/index.astro   home
  pages/work/[slug]   case study template
  pages/lab/scene     scene tuning page with a manual progress slider
```

Case studies carry a `tier` (1 featured, 2 supporting, 3 archive) and an `order`.
The home page reads those; nothing is ordered by date.

## Design tokens

One hue at 222 degrees, expressed as three tokens so the colour stays legible on dark
screens, light screens and print. Neutrals carry the same hue at 4 to 10 percent saturation.

| Token | Hex | Use |
| --- | --- | --- |
| `--brand` | `#3B6FEB` | Print and uncontrolled grounds |
| `--brand-on-dark` | `#6190FF` | Dark surfaces, 6.67:1 |
| `--brand-on-light` | `#2552BA` | Light surfaces, 7.01:1 |
| `--ink` | `#09090A` | Page ground |
| `--surface` | `#101112` | Cards and panels |
| `--line` | `#292B2E` | Hairlines |
| `--dim` | `#7F828A` | Small labels, 4.62:1 worst case |
| `--muted` | `#8E9299` | Body copy, 6.30:1 |
| `--fg` | `#EBEEF5` | Headings, 17.0:1 |

The accent stays in UI chrome: links, focus rings, the wordmark dot, selection frames,
one primary button per screen. Case study pages carry other organisations' screenshots,
and a flooded accent would fight every one of them.

## Accessibility

WCAG 2.2 AA is a build constraint, not a pass at the end: every text colour clears 4.5:1
on the surface it sits on, targets are at least 24px, the menu traps focus and closes on
Escape, external links say so to screen readers, and the whole site works with WebGL
off and with reduced motion on.
