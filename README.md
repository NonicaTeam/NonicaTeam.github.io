# Rev API Docs

Revit API documentation for years 2020-2026, powered by Algolia search.

**Live Site:** [RevApiDocs](https://revapidocs.com)

## Features

- Multi-year Revit API documentation (2020-2026)
- Instant search across all documentation
- Embeddable search snippet for external websites

## Embeddable Search Snippet

Add a Revit API search bar to any website with the following code:

**1. Add CSS to `<head>`:**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@docsearch/css@3" />
```

**2. Add HTML container where you want the search bar:**
```html
<div id="algoliaBar"></div>
```

**3. Add JavaScript before `</body>`:**
```html
<script src="https://cdn.jsdelivr.net/npm/@docsearch/js@3"></script>
<script type="text/javascript">
docsearch({
    appId: "WEH0G3EYGF",
    apiKey: "69d3c9c82f55d09311b4f77f215870a6",
    indexName: "nonicateamio",
    container: "#algoliaBar",
});
</script>
```

## Related

- [Revit API Docs](https://revapidocs.com/)
- [Civil3D API Docs](https://civapidocs.com/)

## License

[MIT License + Attribution](license.md) - by [Nonica.io](https://nonica.io)
