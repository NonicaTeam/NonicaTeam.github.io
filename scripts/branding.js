var allTabSetIds = new Array();

document.addEventListener("DOMContentLoaded", function() {

    // === STEP 2: Generate the Year Links (PageHeader) ===

    // // Define the years to be shown in the top bar
    // const years = [2020, 2021, 2022, 2023, 2024, 2025];

    // // Create the PageHeader div element dynamically
    // const pageHeader = document.createElement('div');
    // pageHeader.id = 'PageHeader';
    // pageHeader.classList.add('pageHeader');

    // // Get the current page file name (assuming the file name is the same in each folder)
    // const currentFileName = window.location.pathname.split('/').pop();

    // // (Functions checkFileExists and fetchPageBodyContent remain unchanged.)
    // const checkFileExists = async (url) => {
    //     try {
    //         const response = await fetch(url, { method: 'HEAD' });
    //         return response.status === 200;
    //     } catch (error) {
    //         console.error('Error checking file:', error);
    //         return false;
    //     }
    // };

    // const fetchPageBodyContent = async (url) => {
    //     try {
    //         const response = await fetch(url);
    //         if (response.ok) {
    //             const text = await response.text();
    //             const tempDiv = document.createElement('div');
    //             tempDiv.innerHTML = text;
    //             const pageBodyContent = tempDiv.querySelector('.pageBody');
    //             return pageBodyContent ? pageBodyContent.innerHTML : null;
    //         }
    //         return null;
    //     } catch (error) {
    //         console.error('Error fetching file content:', error);
    //         return null;
    //     }
    // };

    // const currentPath = window.location.pathname.split('/').slice(0, -1).join('/');

    // const yearLinksPromises = years.map(async (year) => {
    //     const url = `/${year}/${currentFileName}`;
    //     const fileExists = await checkFileExists(url);
    //     let underlineColor = 'inherit';
    //     let textColor = 'white';

    //     if (currentPath === `/${year}`) {
    //         underlineColor = '#5235ef';
    //         textColor = '#5235ef';
    //     } else if (fileExists) {
    //         const filePageBodyContent = await fetchPageBodyContent(url);
    //         const currentPageBodyContent = document.querySelector('.pageBody') ? document.querySelector('.pageBody').innerHTML : null;
    //         if (filePageBodyContent && currentPageBodyContent && filePageBodyContent === currentPageBodyContent) {
    //             underlineColor = '#5235ef';
    //         } else {
    //             underlineColor = 'orange';
    //         }
    //     } else {
    //         underlineColor = '#631201';
    //     }

    //     const link = document.createElement('a');
    //     link.href = url;
    //     link.classList.add('yearlinkstyle');
    //     link.textContent = year;
    //     // Optionally, add your styles here:
    //     link.style.textDecorationColor = underlineColor;
    //     link.style.color = textColor;

    //     return link;
    // });

    // Promise.all(yearLinksPromises).then(yearLinks => {
    //     yearLinks.forEach(link => {
    //         pageHeader.appendChild(link);
    //         pageHeader.appendChild(document.createTextNode(' '));
    //     });
    //     // Insert the PageHeader after the search bar, not at the very top of the body.
    //     // Since searchDiv is the first element, insert PageHeader after it.
    //     if (searchDiv.nextSibling) {
    //         document.body.insertBefore(pageHeader, searchDiv.nextSibling);
    //     } else {
    //         document.body.appendChild(pageHeader);
    //     }
    // });
});


var allLSTSetIds = new Object();

// Help 1 persistence support.  This code must appear inline.
var isHelp1;

var curLoc = document.location + ".";

if(curLoc.indexOf("mk:@MSITStore") === 0)
{
    isHelp1 = true;
    curLoc = "ms-its:" + curLoc.substring(14, curLoc.length - 1);
    document.location.replace(curLoc);
}
else
{
    if(curLoc.indexOf("ms-its:") === 0)
        isHelp1 = true;
    else
        isHelp1 = false;
}

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

// Help 1 persistence object.  This requires a hidden input element on the page with a class of "userDataStyle"
// defined in the style sheet that implements the user data binary behavior:
// <input type="hidden" id="userDataCache" class="userDataStyle" />
var Help1Globals =
{
    UserDataCache: function ()
    {
        var userData = document.getElementById("userDataCache");

        return userData;
    },

    Load: function (key)
    {
        var userData = this.UserDataCache();

        userData.load("userDataSettings");

        var value = userData.getAttribute(key);

        return value;
    },

    Save: function (key, value)
    {
        var userData = this.UserDataCache();
        userData.setAttribute(key, value);
        userData.save("userDataSettings");
    }
};