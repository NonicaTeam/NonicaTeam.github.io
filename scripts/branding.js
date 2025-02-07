// (function() {
//     // Only redirect if this page is not already loaded in an iframe.
//     if (window.self === window.top) {
//       // Get the current URL path. Example: "/2025/1d2da0b1-26ee-91bc-cf36-d70eb73ea821.htm"
//       var pathParts = window.location.pathname.split('/');
//       // Ensure there are enough parts. The first element will be an empty string (from the leading slash).
//       if (pathParts.length >= 3) {
//         // The directory (e.g., "2025") is the second element.
//         var directory = pathParts[1];
//         // The file name (e.g., "1d2da0b1-26ee-91bc-cf36-d70eb73ea821.htm") is the third element.
//         var fileName = pathParts[2];
//         // Build the new URL using the extracted directory.
//         var baseUrl = window.location.protocol + '//' + window.location.host + '/' + directory + '.htm';
//         var newUrl = baseUrl + '?id=' + encodeURIComponent(fileName);
//         // Redirect to the new URL without adding the current page to the session history.
//         window.location.replace(newUrl);
//       }
//     }
//   })();
// Expand or collapse a section
function SectionExpandCollapse(togglePrefix)
{
    var image = document.getElementById(togglePrefix + "Toggle");
    var section = document.getElementById(togglePrefix + "Section");

    if(image !== null && section !== null)
    {
        if(section.style.display === "")
        {
            image.src = image.src.replace("SectionExpanded.png", "SectionCollapsed.png");
            section.style.display = "none";
        }
        else
        {
            image.src = image.src.replace("SectionCollapsed.png", "SectionExpanded.png");
            section.style.display = "";
        }
    }
}
// Expand or collapse a section when it has the focus and Enter is hit
function SectionExpandCollapse_CheckKey(togglePrefix, eventArgs)
{
    if(eventArgs.keyCode === 13)
        SectionExpandCollapse(togglePrefix);
}
// Set the default language on the page
function SetDefaultLanguage(defaultLanguage) { }