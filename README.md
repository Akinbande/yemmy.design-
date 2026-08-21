# yemmy.design

Portfolio of **Solomon Akinbande**, Senior Product Designer and UX Engineer.
Calgary, AB. Available for roles in Canada and global remote.

[hello@yemmy.design](mailto:hello@yemmy.design) · [LinkedIn](https://www.linkedin.com/in/akinoluwayemi/)

## Status

v2 is in design. `site/index.html` is the holding page currently deployed.

## site/

A single self-contained HTML file. No build step, no dependencies, no external
assets: the portrait is embedded as a data URI and the only network request is
Google Fonts. Drop it on any static host.

```bash
python3 -m http.server 4321 --directory site
```

## Design tokens

One hue at 222 degrees, expressed as three tokens so the colour stays legible on
dark screens, light screens and print. Neutrals carry the same hue at 4-10 percent
saturation.

| Token | Hex | Use |
| --- | --- | --- |
| `--brand` | `#3B6FEB` | Print, CV, deck. 4.48:1 dark, 4.50:1 light |
| `--brand-on-dark` | `#6190FF` | Dark surfaces. 6.67:1 |
| `--brand-on-light` | `#2552BA` | Light surfaces. 7.01:1 |
| `--ink` | `#09090A` | Page ground |
| `--surface` | `#101112` | Cards and panels |
| `--line` | `#292B2E` | Hairlines |
| `--muted` | `#8E9299` | Body copy. 6.30:1 |
| `--fg` | `#EBEEF5` | Headings. 17.0:1 |

Type is Archivo for display and the wordmark, IBM Plex Mono for labels and data.

The accent stays in UI chrome only: links, focus rings, the wordmark dot, one
primary button per screen. Case study pages carry other companies' screenshots,
and a flooded accent would fight every one of them.
