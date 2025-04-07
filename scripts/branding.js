
(function() {
    // Only redirect if this page is not already loaded in an iframe.
    if (window.self === window.top) {
      // Get the current URL path. Example: "/2025/1d2da0b1-26ee-91bc-cf36-d70eb73ea821.htm"
      var pathParts = window.location.pathname.split('/');
      // Ensure there are enough parts. The first element will be an empty string (from the leading slash).
      if (pathParts.length >= 3) {
        // The directory (e.g., "2025") is the second element.
        var directory = pathParts[1];

        //Remove after indexing
        if(directory === "2026")
        {
          return;
        }
        ///

        // The file name (e.g., "1d2da0b1-26ee-91bc-cf36-d70eb73ea821.htm") is the third element.
        var fileName = pathParts[2];
        // Build the new URL using the extracted directory.
        var baseUrl = window.location.protocol + '//' + window.location.host + '/' + directory + '.htm';
        var newUrl = baseUrl + '?id=' + encodeURIComponent(fileName);
        // Redirect to the new URL without adding the current page to the session history.
        window.location.replace(newUrl);
      }
    }
  })();

  document.addEventListener("DOMContentLoaded", function () {
    // Select the correct element
    const feedbackElement = document.getElementById("PageFooter");

    if (feedbackElement) {
        feedbackElement.style.display = "block"; // Ensure it's visible

        // Create a div to hold the new content
        const footerDiv = document.createElement("div");
        footerDiv.classList.add("feedbackContent");

        // Add actual links
        footerDiv.innerHTML = `
            Made with ❤️ by <a href="https://nonica.io/" target="_blank">Nonica.io</a>
            <br>
          <span class="inline-links">
            <a href="https://RevAPIDocs.com" target="_blank">Revit API Docs</a>  |  
            <a href="https://CivAPIDocs.com" target="_blank">Civil3D API Docs</a>
          </span>
            Revit® is a registered trademark of Autodesk, Inc. This website is not affiliated with or endorsed by Autodesk, Inc.
        `;

        // Append the new div inside the span
        feedbackElement.prepend(footerDiv);
    }
    //Find Remarks Section and add input box
    const regions = document.querySelectorAll('.collapsibleAreaRegion');
    if(regions && regions.length > 0)
    {
      regions.forEach(region => {
        //Find Remarks section
        if (region.textContent.includes("Remarks")) {
          const nextElem = region.nextElementSibling;
          if (nextElem && nextElem.classList.contains('collapsibleSection'))
          {
              try {
                const summaryElement = document.querySelector('.summary');
                if(summaryElement)
                {
                  nextElem.insertAdjacentText('afterbegin', 'Remarks: ');
                  summaryElement.appendChild(nextElem);
                  //Delete Remarks Toggle
                  region.remove();
                }
              } catch (error) { }
          }
        }
        //Detect if there is a table in next sibling
        const nextSibling = region.nextElementSibling;
        if(nextSibling && !region.textContent.trim().toLowerCase().includes("api changes"))
        {
          const tableEles = nextSibling.querySelectorAll('table');
          if (tableEles && tableEles.length > 0)
          {
            const searchTextbox = document.createElement('input');
            searchTextbox.name = "filterTable"
            searchTextbox.type = 'text';
            searchTextbox.placeholder = '🔎 Search in table...';
            // Add styles for the textbox
            searchTextbox.style.padding = '5px'; // Add space for the icon inside
            searchTextbox.style.fontSize = '14px';
            searchTextbox.style.borderRadius = '5px'; // Rounded corners
            searchTextbox.style.border = '1px solid #d3d3d3'; // Light gray border
            searchTextbox.style.outline = 'none'; // Removes outline on focus (optional)
            searchTextbox.style.marginLeft = '10px'; // Adds margin above to create space between elements
            searchTextbox.style.color = '#5235ef';
            //searchTextbox.style.fontWeight = 'bold';
            searchTextbox.addEventListener('click', function() {
                //Clear the placeholder text when the textbox is clicked
                searchTextbox.placeholder = '';
            });
            searchTextbox.addEventListener('input', function(event) {
                  // Get the current value of the textbox
                  const parentElement = event.target.parentElement;
                  const nextSibling = parentElement.nextElementSibling;
                  const table = nextSibling.querySelector('table');
                  if (table) {
                      // Get the search text entered by the user
                      const searchText = event.target.value.toLowerCase();
                      // Step 4: Get all table rows
                      const rows = table.querySelectorAll('tr');
                      // Loop through all the rows
                      rows.forEach((row, index) => {
                          // Skip the header row (index 0)
                          if (index === 0) {
                              row.style.display = ''; // Ensure header row is visible
                              return;
                          }
                          // Step 5: Get the text content of each row (you can modify this if you want specific columns)
                          const rowText = row.textContent.toLowerCase();
                          // Step 6: If the row contains the search text, show it; otherwise, hide it
                          if (rowText.includes(searchText)) {
                              row.style.display = ''; // Show the row
                          } else {
                              row.style.display = 'none'; // Hide the row
                          }
                      });
                  }
              });
            // Event listener for blur (when the textbox loses focus)
            searchTextbox.addEventListener('blur', function() {
              // If the textbox is empty, restore the placeholder
              if (searchTextbox.value === '') {
                  searchTextbox.placeholder = '🔎 Search in table...'; // Restore the placeholder text
              }
            });
            // Step 6: Append the magnifying glass icon to the div
            region.appendChild(searchTextbox);
          }
        }
      });
    }
    //Iterate Collapsible Area Region

    //Collapse RegionTitle with Inheritance
    const regionTitles = document.querySelectorAll('.collapsibleRegionTitle');
    if(regionTitles){
      regionTitles.forEach(region => {
        if (region.textContent.trim().toLowerCase().includes("inheritance hierarchy")) {
          //Collapse Inheritance
          region.click();
        }
      }
      );
    }
});

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
function SetDefaultLanguage(defaultLanguage) 
{ 
  // Select all spans with the "data-languagespecifictext" attribute
  const spans = document.querySelectorAll('span[data-languagespecifictext]');

  spans.forEach(span => {
    // Get the attribute value, e.g., "cpp=::|nu=."
    const attrValue = span.getAttribute('data-languagespecifictext');

    // Split the string into language-specific parts
    const parts = attrValue.split('|');
    let mapping = {};

    // Create a mapping of language keys to their corresponding values
    parts.forEach(part => {
      const [lang, text] = part.split('=');
      if (lang && text !== undefined) {
        mapping[lang.trim()] = text.trim();
      }
    });

    // If the mapping for the requested language exists, update the span text
    if (mapping[defaultLanguage]) {
      span.textContent = mapping[defaultLanguage];
    }
    else{
      span.textContent = mapping["nu"];
    }
  });
}