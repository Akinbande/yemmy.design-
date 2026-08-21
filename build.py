#!/usr/bin/env python3
"""Build yemmy.design from page.tmpl.html.

Emits two things from one source:
  index.html      a complete standalone document, for Vercel / any static host
  artifact.html   the same page as a head-less fragment, for Claude Artifacts

The share card is built separately by make_og.py.
"""
import base64, pathlib, re

HERE = pathlib.Path(__file__).parent
REPO = pathlib.Path("/Users/yemmy/PROJECT HQ /yemmy.design")

# Absolute origin. Link previews will not render a relative og:image, so this
# has to match the domain the page is actually served from.
SITE = "https://yemmy.design"
OG_V = "1"          # bump to force LinkedIn and friends to re-scrape the card

TITLE    = "Solomon Akinbande, Senior Product Designer"
OG_TITLE = "Solomon Akinbande, Senior Product Designer and UX Engineer"
OG_DESC  = ("Seven years building the systems behind fintech, healthcare, energy and SaaS "
            "products. The next version of yemmy.design is in design. Calgary, Canada, "
            "and global remote.")
OG_ALT   = ("Dark card reading The next version is a system, with Solomon Akinbande's "
            "portrait on the right.")

tmpl = (HERE / "page.tmpl.html").read_text(encoding="utf-8")
tmpl = tmpl.replace("__PHOTO__",
                    "data:image/jpeg;base64," +
                    base64.b64encode((HERE / "portrait.jpg").read_bytes()).decode())

# split at the end of the stylesheet: head material above, page below
head_src, body_src = tmpl.split("</style>", 1)
head_src += "</style>"

# the artifact keeps the template's own <title>; the deployed site gets the SEO one
head_src = re.sub(r"<title>.*?</title>", "", head_src, count=1)
head_src = re.sub(r'<meta name="description".*?>', "", head_src, count=1)

FAVICON = (
  # single quotes inside, so the whole thing survives href="..."
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>"
  "<rect width='64' height='64' rx='14' fill='%2309090A'/>"
  "<text x='30' y='45' font-family='Archivo,Helvetica,Arial,sans-serif' font-size='40'"
  " font-weight='600' fill='%23EBEEF5' text-anchor='middle'>y</text>"
  "<circle cx='50' cy='40' r='5' fill='%236190FF'/></svg>"
)
OG_IMG = f"{SITE}/og.jpg?v={OG_V}"

doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#09090A">

<title>{TITLE}</title>
<meta name="description" content="{OG_DESC}">
<meta name="author" content="Solomon Akinbande">
<link rel="canonical" href="{SITE}/">
<link rel="icon" href="data:image/svg+xml,{FAVICON}">

<meta property="og:type" content="website">
<meta property="og:site_name" content="yemmy.design">
<meta property="og:locale" content="en_CA">
<meta property="og:url" content="{SITE}/">
<meta property="og:title" content="{OG_TITLE}">
<meta property="og:description" content="{OG_DESC}">
<meta property="og:image" content="{OG_IMG}">
<meta property="og:image:secure_url" content="{OG_IMG}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{OG_ALT}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{OG_TITLE}">
<meta name="twitter:description" content="{OG_DESC}">
<meta name="twitter:image" content="{OG_IMG}">
<meta name="twitter:image:alt" content="{OG_ALT}">
{head_src.strip()}
</head>
<body>
{body_src.strip()}
</body>
</html>
"""

(REPO / "index.html").write_text(doc, encoding="utf-8")
(HERE / "coming-soon.html").write_text(tmpl, encoding="utf-8")

for label, text in (("index.html (standalone)", doc), ("artifact fragment", tmpl)):
    assert "—" not in text and "&mdash;" not in text, "em dash leaked into " + label
    print(f"  {label:26} {len(text)//1024:>4} KB")
og = REPO / "og.jpg"
print(f"  {'og.jpg':26} {og.stat().st_size//1024:>4} KB  ->  {OG_IMG}")
print("built ok")
