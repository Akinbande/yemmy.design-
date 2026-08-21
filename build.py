#!/usr/bin/env python3
"""Build yemmy.design from page.tmpl.html.

Emits two things from one source:
  index.html      a complete standalone document, for Vercel / any static host
  artifact.html   the same page as a head-less fragment, for Claude Artifacts
"""
import base64, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
REPO = pathlib.Path("/Users/yemmy/PROJECT HQ /yemmy.design")

tmpl = (HERE / "page.tmpl.html").read_text(encoding="utf-8")
photo = base64.b64encode((HERE / "portrait.jpg").read_bytes()).decode()
tmpl = tmpl.replace("__PHOTO__", "data:image/jpeg;base64," + photo)

# split the template at the end of the stylesheet: head material above, page below
head_src, body_src = tmpl.split("</style>", 1)
head_src += "</style>"
title = re.search(r"<title>(.*?)</title>", head_src).group(1)
desc  = re.search(r'<meta name="description" content="(.*?)">', head_src).group(1)

FAVICON = (
  # single quotes inside, so the whole thing survives href="..."
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>"
  "<rect width='64' height='64' rx='14' fill='%2309090A'/>"
  "<text x='30' y='45' font-family='Archivo,Helvetica,Arial,sans-serif' font-size='40'"
  " font-weight='600' fill='%23EBEEF5' text-anchor='middle'>y</text>"
  "<circle cx='50' cy='40' r='5' fill='%236190FF'/></svg>"
)

doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#09090A">
<meta name="author" content="Solomon Akinbande">
<link rel="canonical" href="https://yemmy.design/">
<link rel="icon" href="data:image/svg+xml,{FAVICON}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://yemmy.design/">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
{head_src}
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
print("built ok")
