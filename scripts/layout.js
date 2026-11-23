/*
 * Rev API Docs - layout for API pages (/{year}/{guid}.htm).
 *
 * Pages are served as themselves (no redirect to /{year}.htm?id=...), so
 * search engines index the real URL. When a page is opened directly, this
 * script turns it into the same "top bar + tree + content" view as the
 * {year}.htm shell, without leaving the URL:
 *   - html.cad-full     -> top-level window: fixed header, tree on the left.
 *   - html.cad-embedded -> inside the shell iframe / search preview: the
 *                          static header and breadcrumb are hidden.
 * The header and breadcrumb themselves are static HTML written by
 * tools/seo_build.py; this file only adds the tree and the search box.
 * Must be loaded from <head> (it sets the class before first paint).
 */
(function () {
    var de = document.documentElement;
    var embedded;
    try { embedded = window.self !== window.top; } catch (e) { embedded = true; }
    if (embedded) { de.className += ' cad-embedded'; return; }

    var m = window.location.pathname.match(/\/(20\d\d)\/([^\/?#]+\.htm)$/i);
    if (!m) return;
    de.className += ' cad-full';

    var year = m[1];
    var current = year + '/' + m[2];
    var base = window.location.pathname.slice(0, window.location.pathname.length - m[0].length) + '/';

    function addCss(href) {
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        document.head.appendChild(l);
    }
    function addScript(src, onload) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = onload;
        document.head.appendChild(s);
    }

    addCss('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap');

    function initSearch() {
        if (typeof window.docsearch !== 'function' || !document.getElementById('cadSearch')) return;
        window.docsearch({
            appId: 'WEH0G3EYGF',
            apiKey: '69d3c9c82f55d09311b4f77f215870a6',
            indexName: 'nonicateamio',
            container: '#cadSearch',
            debug: false,
            transformItems: function (items) {
                return items.map(function (item) {
                    var hr = item._highlightResult || {};
                    var yearContent = hr.year ? hr.year.value : '';
                    if (!hr.tree_breakdown) return Object.assign({}, item, { content: yearContent });
                    var tb = hr.tree_breakdown.value.replace(/Autodesk\.Revit\./g, '').trim();
                    return Object.assign({}, item, { content: tb !== '' ? yearContent + ' | ' + tb : yearContent });
                });
            },
            maxResultsPerGroup: 20,
            initialQuery: year + ' '
        });
    }

    function withFancytree(cb) {
        var jq = window.jQuery;
        if (jq && jq.ui && jq.ui.fancytree) return cb();
        var loadTree = function () { addScript(base + 'scripts/jquery.fancytree-all-deps.min.js', cb); };
        if (jq) loadTree();
        else addScript(base + 'scripts/jquery-3.6.0.min.js', loadTree);
    }

    function go(node) {
        var href = node.data && node.data.href;
        if (href && href !== current) window.location.href = base + href;
        else node.toggleExpanded();
    }

    function buildTree(data) {
        var $ = window.jQuery;
        $('#cadTree').fancytree({
            source: data,
            checkbox: false,
            selectMode: 1,
            // Navigate on click / Enter (not on activate, which also fires on arrow keys).
            click: function (event, d) {
                if (d.targetType === 'title' || d.targetType === 'icon') { go(d.node); return false; }
            },
            keydown: function (event, d) {
                if (event.which === 13) { go(d.node); return false; }
            },
            init: function (event, d) {
                var node = d.tree.findFirst(function (n) { return n.data.href === current; });
                if (!node) return;
                node.makeVisible({ noAnimation: true, noEvents: true, scrollIntoView: false }).done(function () {
                    node.setActive(true, { noEvents: true, scrollIntoView: false });
                    node.setExpanded(true, { noEvents: true, noAnimation: true });
                    var el = node.span;
                    var pane = document.getElementById('cadTree');
                    // Put the current page a third of the way down the pane. Wait for the
                    // web font: it changes row heights and would shift the position.
                    if (!el || !pane) return;
                    var place = function () {
                        pane.scrollTop += el.getBoundingClientRect().top - pane.getBoundingClientRect().top - pane.clientHeight / 3;
                    };
                    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(place, 0); });
                    else setTimeout(place, 0);
                });
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var pane = document.createElement('nav');
        pane.id = 'cadTree';
        pane.setAttribute('aria-label', 'Revit ' + year + ' API tree');
        document.body.appendChild(pane);

        addScript('https://cdn.jsdelivr.net/npm/@docsearch/js@3', initSearch);

        // Wide screens only: the tree is hidden on mobile, so don't download it there.
        if (window.matchMedia && window.matchMedia('(max-width: 700px)').matches) return;
        fetch(base + year + '/toc.json')
            .then(function (r) { return r.json(); })
            .then(function (data) { withFancytree(function () { buildTree(data); }); })
            .catch(function () { });
    });
})();
