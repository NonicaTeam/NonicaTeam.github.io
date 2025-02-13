(function() {
    // Only redirect if this page is not already loaded in an iframe.
    if (window.self === window.top) {
      // Get the current URL path. Example: "/2025/1d2da0b1-26ee-91bc-cf36-d70eb73ea821.htm"
      var pathParts = window.location.pathname.split('/');
      // Ensure there are enough parts. The first element will be an empty string (from the leading slash).
      if (pathParts.length >= 3) {
        // The directory (e.g., "2025") is the second element.
        var directory = pathParts[1];
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
  
/*	
**********
**********   Begin Expand/Collapse
**********
*/

// expand or collapse a section
function ExpandCollapse(imageItem)
{
	if (sectionStates[imageItem.id] == "e")
		CollapseSection(imageItem);
	else
		ExpandSection(imageItem);
	
	SetCollapseAll();
}

// expand or collapse all sections
function ExpandCollapseAll(imageItem)
{
    var collapseAllImage = document.getElementById("collapseAllImage");
    var expandAllImage = document.getElementById("expandAllImage");
    if (imageItem == null || collapseAllImage == null || expandAllImage == null) return;
    noReentry = true; // Prevent entry to OnLoadImage
    
	var imgElements = document.getElementsByName("toggleSwitch");
	var i;
	var collapseAll = (imageItem.src == collapseAllImage.src);
	if (collapseAll)
	{
		imageItem.src = expandAllImage.src;
		imageItem.alt = expandAllImage.alt;

		for (i = 0; i < imgElements.length; ++i)
		{
			CollapseSection(imgElements[i]);
		}
	}
	else
	{
		imageItem.src = collapseAllImage.src;
		imageItem.alt = collapseAllImage.alt;

		for (i = 0; i < imgElements.length; ++i)
		{
			ExpandSection(imgElements[i]);
		}
	}
	SetAllSectionStates(collapseAll);
	SetToggleAllLabel(collapseAll);
	
	noReentry = false;
}

function ExpandCollapse_CheckKey(imageItem, eventObj)
{
	if(eventObj.keyCode == 13)
		ExpandCollapse(imageItem);
}

function ExpandCollapseAll_CheckKey(imageItem, eventObj)
{
	if(eventObj.keyCode == 13)
		ExpandCollapseAll(imageItem);
}

function SetAllSectionStates(collapsed)
{
    for (var sectionId in sectionStates) 
        sectionStates[sectionId] = (collapsed) ? "c" : "e";
}

function ExpandSection(imageItem)
{
    noReentry = true; // Prevent re-entry to OnLoadImage
    try
    {
        var collapseImage = document.getElementById("collapseImage");
		imageItem.src = collapseImage.src;
		imageItem.alt = collapseImage.alt;
		
	    imageItem.parentNode.parentNode.nextSibling.style.display = "";
	    sectionStates[imageItem.id] = "e";
    }
    catch (e)
    {
    }
    noReentry = false;
}

function CollapseSection(imageItem)
{
    noReentry = true; // Prevent re-entry to OnLoadImage
    var expandImage = document.getElementById("expandImage");
	imageItem.src = expandImage.src;
	imageItem.alt = expandImage.alt;
	imageItem.parentNode.parentNode.nextSibling.style.display = "none";
	sectionStates[imageItem.id] = "c";
    noReentry = false;
}

function AllCollapsed()
{
	var imgElements = document.getElementsByName("toggleSwitch");
	var allCollapsed = true;
	var i;
		
	for (i = 0; i < imgElements.length; i++) allCollapsed = allCollapsed && (sectionStates[imgElements[i].id] == "c");
	
	return allCollapsed;
}

function SetCollapseAll()
{
	var imageElement = document.getElementById("toggleAllImage");
	if (imageElement == null) return;
	
	var allCollapsed = AllCollapsed();
	if (allCollapsed)
	{
        var expandAllImage = document.getElementById("expandAllImage");
	    if (expandAllImage == null) return;
		imageElement.src = expandAllImage.src;
		imageElement.alt = expandAllImage.alt;
	}
	else
	{
        var collapseAllImage = document.getElementById("collapseAllImage");
	    if (collapseAllImage == null) return;
		imageElement.src = collapseAllImage.src;
		imageElement.alt = collapseAllImage.alt;
	}
	
	SetToggleAllLabel(allCollapsed);
}

function SetToggleAllLabel(allCollapsed)
{
	var collapseLabelElement = document.getElementById("collapseAllLabel");
	var expandLabelElement = document.getElementById("expandAllLabel");
	
	if (collapseLabelElement == null || expandLabelElement == null) return;
		
	if (allCollapsed)
	{
		collapseLabelElement.style.display = "none";
		expandLabelElement.style.display = "inline";
	}
	else
	{
		collapseLabelElement.style.display = "inline";
		expandLabelElement.style.display = "none";
	}
}

function SaveSections()
{
    try
    {
        var states = "";
    
        for (var sectionId in sectionStates) states += sectionId + ":" + sectionStates[sectionId] + ";";

        Save("SectionStates", states.substring(0, states.length - 1));
    }
    catch (e)
    {
    }
    
}

function OpenSection(imageItem)
{
	if (sectionStates[imageItem.id] == "c") ExpandCollapse(imageItem);
}

/*	
**********
**********   End Expand/Collapse
**********
*/
