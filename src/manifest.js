(function () {
    // Check if `browser` is undefined; assign `chrome` to it if necessary for compatibility with different browsers
    if (typeof browser === "undefined") {
        browser = chrome;
    }

    // Object to manage the script and style injection attempts
    const Interval = {
        AuditControl: {
            Pointer: undefined,  // Holds reference to the interval, so it can be cleared later
            Count: 0,            // Counter to track the number of attempts
            MaxTryCount: 10      // Maximum number of allowed attempts before stopping
        }
    };

    /**
     * Function to create a script tag and set its source
     * @param {string} source - URL of the JavaScript file to be injected
     * @returns {HTMLScriptElement} - The script element with source set
     */
    function BuildScriptTag(source) {
        const script = document.createElement("script");
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', source);
        return script;
    }

    /**
     * Function to create a style tag and set its source
     * @param {string} source - URL of the CSS file to be injected
     * @returns {HTMLLinkElement} - The style (link) element with href set
     */
    function BuildStyleTag(source) {
        const style = document.createElement('link');
        style.setAttribute('rel', 'stylesheet');
        style.setAttribute('type', 'text/css');
        style.setAttribute('href', source); // Correct attribute is `href` for stylesheets
        return style;
    }

    /**
     * Injects the provided sources (scripts and styles) into the document
     * @param {Array} sources - Array of HTML elements (scripts, styles, or HTML) to be injected
     */
    function InjectSource(sources) {
        // Check if the audit engine script is already injected to prevent duplicate loading
        const isAuditAppInjected = Array.from(window.top.document.scripts)
            .find(elem => elem.src.includes("auditengine.js"));

        if (isAuditAppInjected !== undefined) {
            // Exit if audit engine is already present
            return;
        }

        // Find the appropriate <body> element, falling back to a regular <body> tag if necessary
        const body = window.top.document.querySelector('body[scroll=no]') || window.top.document.querySelector('body');

        // Append each source (script/style) to the body
        sources.forEach(function (s) {
            body.appendChild(s);
        });
    }

    /**
     * Sets the source for various images in the application
     */
    function SetImages() {
        // Set the source for each image element using chrome.runtime.getURL
        document.getElementById("app_img_logo_darkmode").src = chrome.runtime.getURL("img/audit128.png");
        document.getElementById("app_img_logo_lightmode").src = chrome.runtime.getURL("img/audit128.png");
        document.getElementById("create_logo").src = chrome.runtime.getURL("img/create_logo.png");
        document.getElementById("update_logo").src = chrome.runtime.getURL("img/update_logo.png");
        document.getElementById("delete_logo").src = chrome.runtime.getURL("img/delete_logo.png");
        document.getElementById("access_logo").src = chrome.runtime.getURL("img/access_logo.png");
    }

    /**
     * Initializes the process to inject scripts, styles, and HTML content
     */
    function Initialize() {
        // Abort if the current URL is an API endpoint (not relevant for this script)
        if (window.location.href.includes('.dynamics.com/api/data/')) {
            return;
        }

        // Set up an interval that will try to inject the content
        Interval.AuditControl.Pointer = setInterval(function () {
            // Increment the number of attempts
            Interval.AuditControl.Count++;

            // Stop trying if the maximum number of attempts is reached
            if (Interval.AuditControl.Count > Interval.AuditControl.MaxTryCount) {
                clearInterval(Interval.AuditControl.Pointer);
                return;
            }

            // Check if the audit history app is already present in the document
            const audithistory_app = document.getElementById("audithistory_app");

            // If not present, attempt to inject the required content
            if (!audithistory_app) {
                // Get the URL of the audit pane HTML template
                const auditPane = browser.runtime.getURL("auditengine.html");

                // Create a new XMLHttpRequest to fetch the HTML content
                const xmlHttp = new XMLHttpRequest();
                xmlHttp.open("GET", auditPane, true);

                // Callback function to handle the response
                xmlHttp.onreadystatechange = function () {
                    if (xmlHttp.readyState === XMLHttpRequest.DONE) {
                        // Check if the request was successful
                        if (xmlHttp.status === 200) {
                            // Create a new div to hold the fetched HTML content
                            const auditHTML = document.createElement("div");
                            auditHTML.innerHTML = xmlHttp.responseText;
                            auditHTML.className = "app-extension-container";

                            // Build the script and style tags
                            const script = BuildScriptTag(browser.runtime.getURL("auditengine.js"));

                            // Inject the HTML, script, and styles into the document
                            InjectSource([script, auditHTML]);

                            // Set the images for the app
                            SetImages();
                        } else if (xmlHttp.status === 400) {
                            console.warn('There was an error 400');
                        } else {
                            console.warn('Something else other than 200 was returned');
                        }
                    }
                };

                // Send the request to load the audit HTML content
                xmlHttp.send();
            } else {
                // If `audithistory_app` exists, stop further attempts
                clearInterval(Interval.AuditControl.Pointer);
            }
        }, 1000);  // Repeat the process every second (1000ms)
    }

    // Start the initialization process
    Initialize();
})();