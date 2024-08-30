(function () {

    // Check if `browser` is undefined and assign `chrome` to it if necessary
    if (typeof browser === "undefined") {
        browser = chrome;
    }

    // Interval control object to manage attempts for injecting scripts and styles
    const Interval = {
        AuditControl: {
            Pointer: undefined,  // Holds the reference to the setInterval
            Count: 0,            // Counter to keep track of attempts
            MaxTryCount: 10      // Maximum number of attempts before giving up
        }
    };

    // Function to build a script tag with the given source URL
    function BuildScriptTag(source) {
        const script = document.createElement("script");
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', source);
        return script;
    }

    // Function to build a style tag with the given source URL
    function BuildStyleTag(source) {
        const style = document.createElement('link');
        style.setAttribute('rel', 'stylesheet');
        style.setAttribute('type', 'text/css');
        style.setAttribute('href', source);  // Corrected to `href` for stylesheet
        return style;
    }

    // Function to inject scripts and styles into the document
    function InjectSource(sources) {
        // Check if the audit app script is already injected
        const isAuditAppInjected = Array.from(window.top.document.scripts)
            .find(elem => elem.src.indexOf("src/js/app.js") > -1);

        if (isAuditAppInjected !== undefined) { // If already injected, exit function
            return;
        }

        // Find the correct body element to inject into
        const body = window.top.document.querySelector('body[scroll=no]') || window.top.document.querySelector('body');

        // Append each source (script/style) to the body
        sources.forEach(function (s) {
            body.appendChild(s);
        });
    }

    // Function to initialize the script injection process
    function Initialize() {
        // Set up an interval to attempt script injection
        Interval.AuditControl.Pointer = setInterval(function () {

            // Increment the attempt counter
            Interval.AuditControl.Count++;

            // If maximum attempts reached, clear the interval
            if (Interval.AuditControl.Count > Interval.AuditControl.MaxTryCount) {
                clearInterval(Interval.AuditControl.Pointer);
            }

            // Check if the specific element `audithistory_app` is present
            const audithistory_app = document.getElementById("audithistory_app");

            if (!audithistory_app) {  // If not present, proceed with injection

                // Get the URL for the pane HTML template
                const auditPane = browser.runtime.getURL("src/pane.html");

                // Create a new XMLHttpRequest to fetch the HTML template
                const xmlHttp = new XMLHttpRequest();
                xmlHttp.open("GET", auditPane, true);

                // Define the callback function for when the request completes
                xmlHttp.onreadystatechange = function () {
                    if (xmlHttp.readyState === XMLHttpRequest.DONE) {
                        if (xmlHttp.status === 200) {  // On successful response
                            const auditHTML = document.createElement("div");
                            auditHTML.innerHTML = xmlHttp.responseText;
                            auditHTML.className = "app-extension-container";

                            // Build the script and style tags
                            const style = BuildStyleTag(browser.runtime.getURL("src/css/app.css"));
                            const script = BuildScriptTag(browser.runtime.getURL("src/js/app.js"));

                            // Inject the styles, scripts, and HTML into the document
                            InjectSource([style, script, auditHTML]);

                        } else if (xmlHttp.status === 400) {  // Handle 400 error
                            alert('There was an error 400');
                        } else {  // Handle other errors
                            alert('Something else other than 200 was returned');
                        }
                    }
                };

                // Send the request to fetch the HTML template
                xmlHttp.send();

            } else {  // If `audithistory_app` is present, stop further attempts
                clearInterval(Interval.AuditControl.Pointer);
            }
        }, 1000);  // Repeat every 1000ms (1 second)
    }

    // Start the initialization process
    Initialize();

})();