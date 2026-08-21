#!/usr/bin/env python3
"""Compose the 1200x630 link-preview card from the brand system."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import pathlib

HERE = pathlib.Path(__file__).parent
W, H = 1200, 630
INK=(9,9,10); FG=(235,238,245); MUTED=(142,146,153); DIM=(94,96,102); BRAND=(97,144,255)

F = lambda n,s: ImageFont.truetype(str(HERE/"fonts"/n), s)
disp   = F("Archivo-SemiBold.ttf", 78)
markf  = F("Archivo-SemiBold.ttf", 34)
monof  = F("PlexMono-Regular.ttf", 17)
mono_s = F("PlexMono-Regular.ttf", 15)

def tracked(draw, xy, text, font, fill, track=0.0):
    """Draw text with letter-spacing; returns the advance width."""
    x, y = xy
    for ch in text:
        if draw: draw.text((x, y), ch, font=font, fill=fill)
        x += font.getlength(ch) + track
    return x - xy[0] - (track if text else 0)

def measure(text, font, track=0.0):
    return tracked(None, (0,0), text, font, None, track)

card = Image.new("RGB", (W,H), INK)

# ---- cobalt glow, top left
glow = Image.new("L", (W,H), 0)
ImageDraw.Draw(glow).ellipse((-360,-420,760,360), fill=52)
glow = glow.filter(ImageFilter.GaussianBlur(150))
card = Image.composite(Image.new("RGB",(W,H),BRAND), card, glow.point(lambda v:int(v*0.55)))

# ---- portrait, right edge, faded into the ink
PW = 430
p = ImageOps.fit(Image.open(HERE/"portrait.jpg").convert("RGB"), (PW,H),
                 method=Image.LANCZOS, centering=(0.5,0.30))
fade = Image.new("L",(PW,H),255)
fd = ImageDraw.Draw(fade)
for i in range(190):                       # left edge dissolves into the ink
    fd.line([(i,0),(i,H)], fill=int(255*(i/190)**1.5))
card.paste(p, (W-PW,0), fade)

# settle the photo's bottom edge into the ink (darkest at y=H, clearing by y=H-240)
shade = Image.new("L",(PW,H),0); sd = ImageDraw.Draw(shade)
SPAN = 240
for i in range(SPAN):
    sd.line([(0,H-i),(PW,H-i)], fill=int(165*((SPAN-i)/SPAN)**1.6))
card.paste(Image.new("RGB",(PW,H),INK), (W-PW,0), shade)

d = ImageDraw.Draw(card)
PAD = 72

# ---- wordmark
wm = tracked(d,(PAD,58),"yemmy",markf,FG,-1.0)
d.text((PAD+wm+1,58),".",font=markf,fill=BRAND)

# ---- headline
TRACK = -3.2
y1, y2 = 214, 306
tracked(d,(PAD,y1),"The next version",disp,FG,TRACK)
w_is = tracked(d,(PAD,y2),"is ",disp,MUTED,TRACK)
sel_x = PAD + w_is + 6
sel_w = measure("a system",disp,TRACK)
tracked(d,(sel_x,y2),"a system",disp,FG,TRACK)

# selection frame + corner handles
box = (sel_x-13, y2+8, sel_x+sel_w+9, y2+disp.size+16)
d.rectangle(box, outline=BRAND, width=2)
for cx,cy in ((box[0],box[1]),(box[2],box[1]),(box[0],box[3]),(box[2],box[3])):
    d.rectangle((cx-6,cy-6,cx+6,cy+6), fill=INK, outline=BRAND, width=2)

# ---- footer block
d.line([(PAD,486),(760,486)], fill=(41,43,46), width=1)
tracked(d,(PAD,510),"SOLOMON AKINBANDE",monof,FG,1.9)
tracked(d,(PAD,540),"SENIOR PRODUCT DESIGNER  ·  UX ENGINEER",mono_s,MUTED,1.7)
tracked(d,(PAD,566),"CALGARY, AB  ·  CANADA  ·  GLOBAL REMOTE",mono_s,DIM,1.7)

out = pathlib.Path("/Users/yemmy/PROJECT HQ /yemmy.design/og.jpg")
card.save(out,"JPEG",quality=90,optimize=True,progressive=True,subsampling=0)
card.save(HERE/"og-preview.jpg","JPEG",quality=90)
print(f"{out.name}  {card.size[0]}x{card.size[1]}  {out.stat().st_size//1024} KB")
