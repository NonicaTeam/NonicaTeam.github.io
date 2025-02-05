// parser-worker.js (Web Worker script)
// Load parse5 library from a CDN (make sure you have network access)
importScripts('https://cdn.jsdelivr.net/npm/es5-parse5@5.1.0/lib/index.min.js');

onmessage = function(event) {
    try {
    const htmlContent = event.data.htmlContent;
    const urlToMatch = event.data.pageurl;  // This is the additional value passed from the main thread
    const year = event.data.apiyear;  // This is the additional value passed from the main thread

    // Parse the HTML content using parse5
    const document = parse5.parse(htmlContent);
    const matches = [];

    // Recursive function to traverse the parsed tree
    function traverse(node) {
        // Check if the node is an element and if it's an anchor tag
        if (node.tagName === 'a' && node.attrs) {
        // Find the href attribute in the attributes array
        const hrefAttr = node.attrs.find(attr => attr.name === 'href');
        if (hrefAttr && hrefAttr.value === year + '/' + urlToMatch) {
            // Extract text content from children (if any)
            let text = '';
            if (node.childNodes) {
            node.childNodes.forEach(child => {
                if (child.nodeName === '#text') {
                text += child.value;
                }
            });
            }
            matches.push({ href: hrefAttr.value, text: text });
        }
        }
        // If the node has child nodes, traverse them recursively
        if (node.childNodes) {
        node.childNodes.forEach(traverse);
        }
    }

    traverse(document);
    postMessage(matches);
    } catch (error) {
        postMessage({ error: 'An error occurred during parsing or matching: ' + error.message });
        self.close();
    }
};