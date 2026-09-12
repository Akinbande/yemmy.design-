"""Render his cover artboards (case studies/cover/*.svg, 2400 x 1557) to lossless PNG for the site.

Each SVG is a plain background, one rounded rectangle filled with an embedded screenshot, and a hairline stroke.
Browsers shrink an embedded screenshot inside an SVG on the fly and it goes soft, so we draw the same geometry here
with a Lanczos resize, straight from his embedded PNG, at the widths the site asks for (src/scripts/cover.ts).
No sharpening, no lossy compression. Re-run after he re-exports a cover:

    python3 tools/render_covers.py
"""
import base64, io, os, re
from PIL import Image, ImageChops, ImageDraw

WIDTHS = (1280, 1600, 1920, 2400)   # keep in step with coverWidths in src/scripts/cover.ts
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# geometry read from his SVGs; each transform is asserted, so a re-export with different numbers fails loudly
SPECS = {
    'collga': dict(bg=(0xF2, 0xF8, 0xF0), rect=(286.75, 196.75, 1826.5, 1138.5), rx=17.25, stroke=0.5,
                   tf='scale(0.000344709 0.000553109)', sx=0.000344709, sy=0.000553109, dx=0.0),
    'luca':   dict(bg=(0xDF, 0xF4, 0xFF), rect=(849.437, 349.437, 701.423, 1526.01), rx=34.5034, stroke=0.873503,
                   tf='matrix(0.00133875 0 0 0.000615764 -0.0020311 0)', sx=0.00133875, sy=0.000615764, dx=-0.0020311),
}


def render(src, sp, W, S=4):
    """One width. Shapes are drawn at S times the size and reduced, so corners and the hairline are smooth."""
    k = W / 2400
    H = round(1557 * k)
    x, y, w, h = sp['rect']
    iw, ih = src.size[0] * sp['sx'] * w, src.size[1] * sp['sy'] * h   # the pattern image in artboard units
    out = Image.new('RGBA', (W, H), sp['bg'] + (255,))
    # the screenshot, resized once from his original, placed at the rectangle and clipped to its rounded corners
    shot = src.resize((round(iw * k), round(ih * k)), Image.LANCZOS).convert('RGBA')
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.paste(shot, (round((x + sp['dx'] * w) * k), round(y * k)))
    mask = Image.new('L', (W * S, H * S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([round(x * k * S), round(y * k * S), round((x + w) * k * S), round((y + h) * k * S)],
                                           radius=round(sp['rx'] * k * S), fill=255)
    layer.putalpha(ImageChops.multiply(layer.getchannel('A'), mask.resize((W, H), Image.LANCZOS)))
    out = Image.alpha_composite(out, layer)
    # the #636363 hairline, centred on the rectangle's edge as in SVG
    sw = sp['stroke'] * k * S
    line = Image.new('L', (W * S, H * S), 0)
    ImageDraw.Draw(line).rounded_rectangle([round(x * k * S - sw / 2), round(y * k * S - sw / 2), round((x + w) * k * S + sw / 2), round((y + h) * k * S + sw / 2)],
                                           radius=round(sp['rx'] * k * S + sw / 2), outline=255, width=max(1, round(sw)))
    ink = Image.new('RGBA', (W, H), (0x63, 0x63, 0x63, 255))
    ink.putalpha(line.resize((W, H), Image.LANCZOS))
    return Image.alpha_composite(out, ink).convert('RGB')


def main():
    for name, sp in SPECS.items():
        svg = open(os.path.join(ROOT, 'case studies', 'cover', f'{name}.svg')).read()
        assert sp['tf'] in svg, f'{name}: the SVG geometry changed; update SPECS from the new file'
        src = Image.open(io.BytesIO(base64.b64decode(re.search(r'base64,([^"]+)"', svg).group(1))))
        src.load()
        if src.mode == 'RGBA' and src.getchannel('A').getextrema()[0] == 255:
            src = src.convert('RGB')   # fully opaque: resize as RGB
        for W in WIDTHS:
            path = os.path.join(ROOT, 'public', 'covers', f'{name}-{W}.png')
            render(src, sp, W).save(path, optimize=True)
            print(f'{name}-{W}.png', f'{os.path.getsize(path) // 1024} KB')


if __name__ == '__main__':
    main()
