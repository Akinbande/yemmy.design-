// His cover artboards (2400 x 1557, from case studies/cover/*.svg), rendered by tools/render_covers.py to lossless PNG
// at these widths with a Lanczos resize: public/covers/<name>-<width>.png.
export const coverWidths = [1280, 1600, 1920, 2400];
export const coverSrc = (base: string) => `${base}-1280.png`;
export const coverSrcset = (base: string) => coverWidths.map((w) => `${base}-${w}.png ${w}w`).join(', ');
// A cover set to fill its panel is drawn wider than the panel (up to ~800px on desktop, when a tall card crops the sides),
// so the browser is told 800px: a 2x screen then always gets a file larger than it draws, and only ever shrinks it (sharp),
// never stretches it (soft). Phones take the full width.
export const coverSizes = '(max-width: 860px) 100vw, 800px';
