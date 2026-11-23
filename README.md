# Rev API Docs

Revit API documentation for years 2020-2027, powered by Algolia search.

**Live Site:** [RevApiDocs](https://revapidocs.com)

## Features

- Multi-year Revit API documentation (2020-2027)
- Instant search across all documentation
- Embeddable search snippet for external websites

## SEO build

Every API page (`/{year}/{guid}.htm`) is a standalone, indexable page: when opened directly it shows the top bar, the year tabs, search and the tree on its own URL (`scripts/layout.js` + `styles/doclayout.css`). Inside the `{year}.htm` shell iframe, that header is hidden.

After adding a new API year or regenerating the docs, run this from the repo root and commit the result:

```bash
python tools/seo_build.py
```

It rewrites the pages in place and is safe to re-run (unchanged files are left alone; a second run reports 0 updated pages). For each page it sets:

- the title with the year (`{Title} | Revit {year} API`) and `lang="en"`
- the canonical link, viewport and a fallback meta description
- the breadcrumb (visible and as JSON-LD) and links to the same page in other years

It also moves each year's tree to `{year}/toc.json` and regenerates `sitemap*.xml` and `robots.txt`. Injected markup sits between `<!--seo:...-->` markers, so don't edit it by hand.

### Adding a new API year

1. Copy the generated HTML pages into a `{year}/` folder (e.g. `2028/`).
2. Copy the latest `{year}.htm` to `2028.htm`, then set `window.year` and the title. For the tree, either replace the `source: {url: ...}` line with the new inline `source: [ ... ],` JSON (the build moves it to `2028/toc.json`), or write `2028/toc.json` directly.
3. Add a `2028` button to `index.html` and to every `{year}.htm`.
4. Run `python tools/seo_build.py`. The year tabs on every existing page are regenerated to include 2028.
5. Check locally: run `python -m http.server`, then open `http://localhost:8000/2028.htm` and one page under `/2028/`.
6. Commit and push to `main` (GitHub Pages deploys it), then resubmit `sitemap.xml` in Search Console.

## Embeddable Search Snippet

Add a Revit API search bar to any website. Copy-paste the full snippet directly into WordPress (Custom HTML block), Webflow, Squarespace, or any HTML page.

**Full snippet (copy-paste ready):**
```html
<!-- 1. CSS - Add to <head> -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@docsearch/css@3" />

<!-- 2. HTML Container - Add where you want the search bar -->
<div id="algoliaBar"></div>

<!-- 3. JavaScript - Add before </body> -->
<script src="https://cdn.jsdelivr.net/npm/@docsearch/js@3"></script>
<script type="text/javascript">
docsearch({
    appId: "WEH0G3EYGF",
    apiKey: "69d3c9c82f55d09311b4f77f215870a6",
    indexName: "nonicateamio",
    container: "#algoliaBar",
    debug: false,
    transformItems(items) {
        return items.map((item) => {
            const yearContent = item._highlightResult.year.value;
            if (!item._highlightResult || !item._highlightResult.tree_breakdown) {
                return { ...item, content: yearContent };
            }
            let treeBreakdown = item._highlightResult.tree_breakdown.value;
            treeBreakdown = treeBreakdown.replace(/Autodesk\.Revit\./g, "").trim();
            const newContent = treeBreakdown !== "" 
                ? `${yearContent} | ${treeBreakdown}` 
                : yearContent;
            return { ...item, content: newContent };
        });
    },
    maxResultsPerGroup: 20,
    initialQuery: "2027 ",
});
</script>
```

## Related

- [Revit API Docs](https://revapidocs.com/)
- [Civil3D API Docs](https://civapidocs.com/)

## License

[MIT License + Attribution](license.md) - by [Nonica.io](https://nonica.io)
