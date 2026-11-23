#!/usr/bin/env python3
"""
SEO build for revapidocs.com. Rewrites files in place and is idempotent:
run it again after adding a new API year or regenerating the docs.

    python tools/seo_build.py            # from the repo root

What it does
------------
* Every API page (/{year}/*.htm):
    - <title> gets the year: "Point.Create(XYZ, ElementId) Method | Revit 2027 API"
      (2020-2024 pages use their full "Class.Member" rltitle).
    - <html lang="en">, viewport, self-canonical, a fallback meta description,
      BreadcrumbList JSON-LD, plus doclayout.css + layout.js.
    - A static header (home link, links to the same page in every API year,
      search box slot) and a breadcrumb, right after <body>.
  Everything injected sits between <!--seo:...--> markers, so it is replaced
  on every run.
* Year shells (/{year}.htm): the inline tree JSON moves to /{year}/toc.json,
  and the shells get a canonical (rewritten to the API page when ?id= is
  present), a description, year buttons with real hrefs, and a <noscript>
  namespace list.
* index.html: description, canonical, WebSite JSON-LD and a line of crawlable links.
* sitemap.xml (index) + sitemap-main.xml + sitemap-{year}.xml, robots.txt.

Only the Python standard library is used. Files are read and written with
surrogateescape and newline="" so BOMs and CRLF line endings are preserved.
"""
import datetime
import html
import json
import os
import re
import subprocess
import sys

SITE = "https://revapidocs.com"
PRODUCT = "Revit"
HOME_NAME = "Rev API Docs"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YEARS = sorted(d for d in os.listdir(ROOT) if re.fullmatch(r"20\d\d", d) and os.path.isdir(os.path.join(ROOT, d)))
LATEST = YEARS[-1]

TITLE_SUFFIX_RE = re.compile(r"\s*\|\s*Revit 20\d\d API\s*$")
BLOCK_RE = {name: re.compile(r"<!--seo:%s-->.*?<!--/seo:%s-->" % (name, name), re.S) for name in ("head", "body", "ns", "links")}


# ---------------------------------------------------------------- helpers
def read(path):
    with open(path, encoding="utf-8", errors="surrogateescape", newline="") as f:
        return f.read()


def write_if_changed(path, text, eol_insensitive=False):
    """Write only when the content differs. Generated files (sitemaps, robots,
    toc.json) compare EOL-insensitively: git may check them out with CRLF."""
    if os.path.exists(path):
        old = read(path)
        if old == text or (eol_insensitive and old.replace("\r\n", "\n") == text.replace("\r\n", "\n")):
            return False
    with open(path, "w", encoding="utf-8", errors="surrogateescape", newline="") as f:
        f.write(text)
    return True


def strip_blocks(text, *names):
    for n in names:
        text = BLOCK_RE[n].sub("", text)
    return text


def esc(s):
    """Escape plain text for HTML text/attributes."""
    return html.escape(s, quote=True)


def plain(s):
    """HTML fragment/escaped title -> plain text."""
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s))).strip()


def jsonld(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


# ---------------------------------------------------------------- tree
# The closing bracket of the inline tree may be indented.
TREE_RE = re.compile(r"source: (\[\s*\{.*?\n\s*\]),(\s*\n\s*checkbox:)", re.S)


def load_tree(year):
    """Return the year's tree, moving inline JSON out of {year}.htm into {year}/toc.json."""
    shell_path = os.path.join(ROOT, year + ".htm")
    toc_path = os.path.join(ROOT, year, "toc.json")
    shell = read(shell_path)
    m = TREE_RE.search(shell)
    if m:
        tree = json.loads(m.group(1))
        write_if_changed(toc_path, json.dumps(tree, ensure_ascii=False, separators=(",", ":")), eol_insensitive=True)
        shell = shell[: m.start()] + 'source: {url: window.year + "/toc.json", cache: true},' + m.group(2) + shell[m.end():]
        write_if_changed(shell_path, shell)
    else:
        with open(toc_path, encoding="utf-8") as f:
            tree = json.load(f)
    return tree


def top_nodes(tree):
    """Revit trees have a single "Namespaces" root: return it plus the namespaces."""
    if len(tree) == 1 and tree[0].get("children"):
        return [tree[0]] + list(tree[0]["children"])
    return list(tree)


def index_tree(tree):
    """href -> list of ancestor (title, href) from the root down."""
    parents = {}

    def walk(nodes, chain):
        for n in nodes:
            href = n.get("href")
            if href and href not in parents:
                parents[href] = list(chain)
            walk(n.get("children") or [], chain + [(n.get("title", ""), href)])

    walk(tree, [])
    return parents


# ---------------------------------------------------------------- API pages
def page_title(text, year):
    """Base title (HTML-escaped, without year suffix)."""
    rl = re.search(r'<mshelp:rltitle title="([^"]*)"', text)
    if rl:  # 2020-2024: "Point.Create Method (XYZ, ElementId) (Autodesk.Revit.DB)",
        # namespace pages: "Autodesk.Revit.DB.Mechanical Namespace ()"
        t = re.sub(r"\s*\((?:(?:Autodesk|System)[\w.]*)?\)\s*$", "", rl.group(1))
    else:
        m = re.search(r"<title>(.*?)</title>", text, re.S)
        t = m.group(1) if m else ""
    t = TITLE_SUFFIX_RE.sub("", t)
    return re.sub(r"\s+", " ", t).strip()


def process_page(year, fname, parents, exists):
    path = os.path.join(ROOT, year, fname)
    orig = read(path)
    text = strip_blocks(orig, "head", "body")
    href = year + "/" + fname
    url = "%s/%s" % (SITE, href)

    title = page_title(text, year)
    full_title = "%s | %s %s API" % (title, PRODUCT, year)
    text, n = re.subn(r"<title>.*?</title>", lambda _: "<title>%s</title>" % full_title, text, count=1, flags=re.S)
    if n != 1:
        raise RuntimeError("no <title>: " + path)

    if not re.search(r"<html[^>]*\slang=", text):  # some WhatsNew pages have two <html> tags
        text = re.sub(r"<html([^>]*)>", r'<html lang="en"\1>', text, count=1)

    # ---- head (inserted before </head>, so the charset stays within the first 1024 bytes)
    head = [
        '<meta name="viewport" content="width=device-width, initial-scale=1" />',
        '<link rel="canonical" href="%s" />' % url,
    ]
    if not re.search(r'name="[Dd]escription"', text):
        desc = "%s - Autodesk Revit %s .NET API reference: syntax, members and related types." % (plain(title), year)
        head.append('<meta name="description" content="%s" />' % esc(desc))
    if not re.search(r'rel="(?:shortcut )?icon"', text):  # 2020-2024 pages: avoid a /favicon.ico 404
        head.append('<link rel="icon" href="../icons/favicon.ico" type="image/x-icon" />')

    chain = parents.get(href, [])
    crumbs = [("Revit API", SITE + "/"), ("Revit %s API" % year, "%s/%s.htm" % (SITE, year))]
    crumbs += [(plain(t), "%s/%s" % (SITE, h)) for t, h in chain if h]
    crumbs.append((plain(title), url))
    head.append('<script type="application/ld+json">%s</script>' % jsonld({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(crumbs)],
    }))
    head.append('<link rel="stylesheet" type="text/css" href="../styles/doclayout.css" />')
    head.append('<script type="text/javascript" src="../scripts/layout.js"></script>')
    # Insert before </head> (keeps the charset in the first 1024 bytes). The 2020-2024
    # mshelp pages have an <xml><mshelp:...> island inside <head>: browsers close <head>
    # at that unknown element, so anything after it (canonical included) would be
    # parsed into <body>. Insert before that island instead.
    block = "<!--seo:head-->%s<!--/seo:head-->" % "".join(head)
    hpos, xpos = text.find("</head>"), text.find("<xml>")
    if hpos < 0:
        raise RuntimeError("no </head>: " + path)
    pos = xpos if 0 <= xpos < hpos else hpos
    text = text[:pos] + block + text[pos:]

    # ---- body: static header + breadcrumb
    years = []
    for y in YEARS:
        if y == year:
            years.append('<a class="cad-sel" aria-current="page" href="../%s/%s">%s</a>' % (y, fname, y))
        elif fname in exists[y]:
            years.append('<a href="../%s/%s" title="This page in the Revit %s API">%s</a>' % (y, fname, y, y))
        else:
            years.append('<a class="cad-na" href="../%s.htm" title="Not available in the Revit %s API">%s</a>' % (y, y, y))
    crumb_html = ['<a href="../">%s</a>' % HOME_NAME, '<a href="../%s.htm">Revit %s API</a>' % (year, year)]
    crumb_html += ['<a href="../%s">%s</a>' % (h, esc(plain(t))) for t, h in chain if h]
    crumb_html.append("<span>%s</span>" % esc(plain(title)))
    body = (
        '<div id="cadTop"><a class="cad-home" href="../">&lt; %s</a>'
        '<nav class="cad-years" aria-label="Revit API version">%s</nav><div id="cadSearch"></div></div>'
        '<nav id="cadCrumbs" aria-label="Breadcrumb">%s</nav>'
    ) % (HOME_NAME, "".join(years), " &rsaquo; ".join(crumb_html))
    text, n = re.subn(r"(<body[^>]*>)", lambda m: m.group(1) + "<!--seo:body-->%s<!--/seo:body-->" % body, text, count=1)
    if n != 1 or "<!--seo:head-->" not in text:
        raise RuntimeError("unexpected structure: " + path)

    return write_if_changed(path, text)


# ---------------------------------------------------------------- year shells
def process_shell(year, tree):
    path = os.path.join(ROOT, year + ".htm")
    text = strip_blocks(read(path), "head", "ns")

    desc = ("Autodesk Revit %s .NET API documentation: browse every namespace, class, "
            "method and property, with instant search across %s-%s." % (year, YEARS[0], LATEST))
    head = (
        '<meta name="viewport" content="width=device-width, initial-scale=1" />'
        '<meta name="description" content="%s" />'
        '<link rel="canonical" id="cadCanonical" href="%s/%s.htm" />'
        "<script>(function(){var id=new URLSearchParams(location.search).get('id');"
        "if(id&&/^[\\w.-]+\\.htm$/.test(id)&&id!=='WhatsNew.htm'){"
        "document.getElementById('cadCanonical').href='%s/%s/'+id;}})();</script>"
    ) % (esc(desc), SITE, year, SITE, year)
    text = text.replace("</head>", "<!--seo:head-->%s<!--/seo:head--></head>" % head, 1)

    # Year buttons: real hrefs (AssignLinksToButtons still updates them per page).
    text = re.sub(r'<a (style="[^"]*")>(<button class="[^"]*">(20\d\d)</button>)', r'<a \1 href="\3.htm">\2', text)

    # Keep users in the tree view when switching year from the shell.
    text = text.replace(
        "linkWrap.setAttribute('href', finalurl);",
        "linkWrap.setAttribute('href', year + \".htm?id=\" + cleanURL);")
    text = re.sub(
        r"window\.location\.href = finalurl(?=\r?\n)",
        lambda _: "window.location.href = year + \".htm?id=\" + cleanURL", text)

    ns = "".join('<li><a href="%s">%s</a></li>' % (esc(n["href"]), esc(plain(n.get("title", ""))))
                 for n in top_nodes(tree) if n.get("href"))
    noscript = '<!--seo:ns--><noscript><h1>Revit %s API namespaces</h1><ul>%s</ul></noscript><!--/seo:ns-->' % (year, ns)
    if text.count('<div id="tree"></div>') != 1:
        raise RuntimeError("tree div not found: " + path)
    text = text.replace('<div id="tree"></div>', '<div id="tree">%s</div>' % noscript, 1)
    return write_if_changed(path, text)


# ---------------------------------------------------------------- homepage
def process_index(trees, exists):
    path = os.path.join(ROOT, "index.html")
    text = strip_blocks(read(path), "head", "links")
    head = (
        '<meta name="description" content="Free, searchable Autodesk Revit .NET API documentation '
        'for %s-%s: every namespace, class, method and property, with instant search." />'
        '<link rel="canonical" href="%s/" />'
        '<script type="application/ld+json">%s</script>'
    ) % (YEARS[0], LATEST, SITE, jsonld({"@context": "https://schema.org", "@type": "WebSite", "name": HOME_NAME, "url": SITE + "/"}))
    text = text.replace("</head>", "<!--seo:head-->%s<!--/seo:head--></head>" % head, 1)

    # One compact line: the namespace index plus top-level namespaces only
    # (DB, UI, ...); the namespace index page links to all the sub-namespaces.
    links = []
    for n in top_nodes(trees[LATEST]):
        if n.get("href"):
            t = plain(n.get("title", ""))
            label = t.replace("Autodesk.Revit.", "") or t
            if "." in label:
                continue
            links.append('<a href="%s">%s</a>' % (esc(n["href"]), esc(label)))
    if "WhatsNew.htm" in exists[LATEST]:
        links.insert(0, '<a href="%s/WhatsNew.htm">What\'s new in %s</a>' % (LATEST, LATEST))
    block = ('<!--seo:links--><nav class="bodyText nsLinks" aria-label="Revit %s API namespaces">'
             'Revit %s API: %s</nav><!--/seo:links-->') % (LATEST, LATEST, " &middot; ".join(links))
    anchor = '<span class="bodyText">by Nonica.io</span>'
    if anchor not in text:
        raise RuntimeError("index.html anchor not found")
    text = text.replace(anchor, anchor + block, 1)
    return write_if_changed(path, text)


# ---------------------------------------------------------------- sitemaps
def git_dates():
    """path -> last commit date (YYYY-MM-DD); uncommitted changes -> today."""
    out = subprocess.run(["git", "-c", "core.quotepath=off", "log", "--format=--%cs", "--name-only"], cwd=ROOT,
                         capture_output=True, text=True, encoding="utf-8", errors="replace").stdout
    dates, cur = {}, None
    for line in out.splitlines():
        if line.startswith("--"):
            cur = line[2:]
        elif line and line not in dates:
            dates[line] = cur
    today = datetime.date.today().isoformat()
    dirty = subprocess.run(["git", "-c", "core.quotepath=off", "status", "--porcelain", "--no-renames", "-uall"], cwd=ROOT,
                           capture_output=True, text=True, encoding="utf-8", errors="replace").stdout
    for line in dirty.splitlines():
        p = line[3:].strip().strip('"')
        dates[p] = today
    return dates, today


def write_sitemaps(exists):
    dates, today = git_dates()

    def urlset(entries):
        body = "".join("<url><loc>%s</loc><lastmod>%s</lastmod></url>\n" % (esc(loc), d) for loc, d in entries)
        return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s</urlset>\n' % body

    maps = []
    main = [(SITE + "/", dates.get("index.html", today))]
    main += [("%s/%s.htm" % (SITE, y), dates.get(y + ".htm", today)) for y in reversed(YEARS)]
    write_if_changed(os.path.join(ROOT, "sitemap-main.xml"), urlset(main), eol_insensitive=True)
    maps.append(("sitemap-main.xml", max(d for _, d in main)))
    for y in reversed(YEARS):
        entries = [("%s/%s/%s" % (SITE, y, f), dates.get("%s/%s" % (y, f), today)) for f in sorted(exists[y])]
        name = "sitemap-%s.xml" % y
        write_if_changed(os.path.join(ROOT, name), urlset(entries), eol_insensitive=True)
        maps.append((name, max(d for _, d in entries)))

    index = "".join("<sitemap><loc>%s/%s</loc><lastmod>%s</lastmod></sitemap>\n" % (SITE, n, d) for n, d in maps)
    write_if_changed(os.path.join(ROOT, "sitemap.xml"),
                     '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s</sitemapindex>\n' % index,
                     eol_insensitive=True)
    write_if_changed(os.path.join(ROOT, "robots.txt"),
                     "User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % SITE, eol_insensitive=True)


# ---------------------------------------------------------------- main
def main():
    exists = {y: {f for f in os.listdir(os.path.join(ROOT, y)) if f.endswith(".htm")} for y in YEARS}
    trees = {}
    for y in YEARS:
        trees[y] = load_tree(y)
        changed = process_shell(y, trees[y])
        print("%s.htm: %s" % (y, "updated" if changed else "unchanged"), flush=True)

    total = 0
    for y in YEARS:
        parents = index_tree(trees[y])
        changed = sum(process_page(y, f, parents, exists) for f in sorted(exists[y]))
        total += changed
        missing = sum(1 for f in exists[y] if "%s/%s" % (y, f) not in parents)
        print("%s/: %d pages, %d updated, %d not in tree" % (y, len(exists[y]), changed, missing), flush=True)

    print("index.html:", "updated" if process_index(trees, exists) else "unchanged")
    write_sitemaps(exists)
    print("sitemaps + robots.txt written")
    print("TOTAL pages updated: %d" % total)


if __name__ == "__main__":
    sys.exit(main())
