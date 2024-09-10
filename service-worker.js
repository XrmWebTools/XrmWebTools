// Check for 'browser' or fallback to 'chrome'
if (typeof browser === "undefined") {
    browser = chrome;
}

// Handle the click event on the extension icon
browser.action.onClicked.addListener(() => {

    // Define a function to toggle the visibility of the element
    const toggleElement = () => {


        const pane = document.querySelector(".app-extension-sections");

        if (pane) {
            // Check current display value
            const isVisible = window.getComputedStyle(pane).display !== "none";

            // Apply transition for slide effect
            pane.style.transition = "height 0.3s ease, opacity 0.3s ease";
            pane.style.overflow = "hidden";
            pane.style.opacity = isVisible ? 0 : 1;

            if (isVisible) {
                // Hide the element
                pane.style.height = "0";
                setTimeout(() => {
                    pane.style.display = "none";
                }, 300); // Timeout matches the duration of the transition
            } else {
                // Show the element
                pane.style.display = "block";
                pane.style.height = "auto"; // Reset to auto to get the natural height
                const height = pane.offsetHeight; // Get the natural height
                pane.style.height = "0"; // Set to 0 initially
                pane.style.opacity = 1; // Ensure opacity is full

                // Force a reflow to apply the height change
                pane.offsetHeight;

                // Expand the element to the natural height
                pane.style.height = `${height}px`;
                console.log("auditengine: Opening triggered");
                document.getElementById("auditengine_opened").click();

            }
        } else {
            console.error("Element with class 'app-extension-sections' not found.");
        }
    };

    // Query the active tab
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            const tabId = tabs[0].id;
            console.log('Tab ID:', tabId);

            // Execute the function in the context of the active tab
            browser.scripting.executeScript({
                target: { tabId: tabId },
                func: toggleElement
            }).then(() => {
                console.log('Script execution completed');
            }).catch(error => {
                console.error('Script execution failed:', error);
            });
        } else {
            console.error("No active tab found.");
        }
    });
});
