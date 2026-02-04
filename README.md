# Rev API Docs

Revit API documentation for years 2020-2026, powered by Algolia search.

**Live Site:** [RevApiDocs](https://revapidocs.com)

## Features

- Multi-year Revit API documentation (2020-2026)
- Instant search across all documentation
- Embeddable search snippet for external websites

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
    initialQuery: "2026 ",
});
</script>
```

## Related

- [Revit API Docs](https://revapidocs.com/)
- [Civil3D API Docs](https://civapidocs.com/)

## License

[MIT License + Attribution](license.md) - by [Nonica.io](https://nonica.io)
