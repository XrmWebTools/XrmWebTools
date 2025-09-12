
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
	 * Initializes the process to inject scripts, styles, and HTML content
	 */
	function Initialize_StartPage() {



		const doc = window.top.document.documentElement;

		// This clears the entire HTML content of the page
		doc.innerHTML = "";

		Interval.AuditControl.Pointer = setInterval(function () {

			// Increment the number of attempts
			Interval.AuditControl.Count++;

			// Stop trying if the maximum number of attempts is reached
			if (Interval.AuditControl.Count > Interval.AuditControl.MaxTryCount) {
				clearInterval(Interval.AuditControl.Pointer);
				return;
			}

			// Check if the audit history app is already present in the document
			const XrmWebTools = document.getElementById("XrmWebTools");
			// If not present, attempt to inject the required content
			if (!XrmWebTools) {
				// Get the URL of the audit pane HTML template
				const auditPane = browser.runtime.getURL("tools/startpage/startpage.html");

				// Create a new XMLHttpRequest to fetch the HTML content
				const xmlHttp = new XMLHttpRequest();
				xmlHttp.open("GET", auditPane, true);

				// Callback function to handle the response
				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState === XMLHttpRequest.DONE) {
						// Check if the request was successful
						if (xmlHttp.status === 200) {
							

							// Build the script and style tags
							const js = BuildScriptTag(browser.runtime.getURL("tools/startpage/startpage.js"));
							const aaimg = BuildScriptTag(browser.runtime.getURL("img/aaimg.js"));
							const css = BuildStyleTag(browser.runtime.getURL("popup/popup.css"));
							const shared = BuildScriptTag(browser.runtime.getURL("tools/shared/shared.js"));

							const doc = window.top.document.documentElement;

							// This clears the entire HTML content of the page
							doc.innerHTML = "";
							doc.innerHTML = xmlHttp.responseText;


							const body = window.top.document.querySelector('body[scroll=no]') || window.top.document.querySelector('body');

							body.appendChild(css);

							body.appendChild(js);
							body.appendChild(shared);

							body.appendChild(aaimg);

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
				// If `XrmWebTools` exists, stop further attempts
				clearInterval(Interval.AuditControl.Pointer);
			}
		}, 1000);  // Repeat the process every second (1000ms)
	}



	function Initialize_PluginRegistrationTool() {



		const doc = window.top.document.documentElement;
		// This clears the entire HTML content of the page
		doc.innerHTML = "";
		Interval.AuditControl.Pointer = setInterval(function () {
			// Increment the number of attempts
			Interval.AuditControl.Count++;
			// Stop trying if the maximum number of attempts is reached
			if (Interval.AuditControl.Count > Interval.AuditControl.MaxTryCount) {
				clearInterval(Interval.AuditControl.Pointer);
				return;
			}
			// Check if the audit history app is already present in the document
			const audithistory_app = document.getElementById("XrmWebTools");
			// If not present, attempt to inject the required content
			if (!audithistory_app) {
				// Get the URL of the audit pane HTML template
				const auditPane = browser.runtime.getURL("tools/pluginregistration/pluginregistration.html");
				// Create a new XMLHttpRequest to fetch the HTML content
				const xmlHttp = new XMLHttpRequest();
				xmlHttp.open("GET", auditPane, true);
				// Callback function to handle the response
				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState === XMLHttpRequest.DONE) {
						// Check if the request was successful
						if (xmlHttp.status === 200) {
							// Create a new div to hold the fetched HTML content
							const css = BuildStyleTag(browser.runtime.getURL("popup/popup.css"));
							const shared = BuildScriptTag(browser.runtime.getURL("tools/shared/shared.js"));

							// Build the script and style tags
							const js = BuildScriptTag(browser.runtime.getURL("tools/pluginregistration/pluginregistration.js"));
							//const css = BuildStyleTag(browser.runtime.getURL("engine/engine.css"));
							const doc = window.top.document.documentElement;
							// This clears the entire HTML content of the page
							doc.innerHTML = "";
							doc.innerHTML = xmlHttp.responseText;
							const body = window.top.document.querySelector('body[scroll=no]') || window.top.document.querySelector('body');
							body.appendChild(js);
							body.appendChild(shared);

							body.appendChild(css);
						} else if (xmlHttp.status === 400) {
							console.warn('There was an error 400');
						} else {
							console.warn('Something else other than 200 was returned');
						}
					}
				};
				xmlHttp.send(); // Send the request to load the audit HTML content
			} else {
				clearInterval(Interval.AuditControl.Pointer); // If `audithistory_app` exists, stop further attempts
			}
		}, 1000);  // Repeat the process every second (1000ms)
	}

	function Initialize_AuditEngine() {



		const doc = window.top.document.documentElement;
		// This clears the entire HTML content of the page
		doc.innerHTML = "";
		Interval.AuditControl.Pointer = setInterval(function () {
			// Increment the number of attempts
			Interval.AuditControl.Count++;
			// Stop trying if the maximum number of attempts is reached
			if (Interval.AuditControl.Count > Interval.AuditControl.MaxTryCount) {
				clearInterval(Interval.AuditControl.Pointer);
				return;
			}
			// Check if the audit history app is already present in the document
			const audithistory_app = document.getElementById("XrmWebTools");
			// If not present, attempt to inject the required content
			if (!audithistory_app) {
				// Get the URL of the audit pane HTML template
				const auditPane = browser.runtime.getURL("tools/auditengine/auditengine.html");
				// Create a new XMLHttpRequest to fetch the HTML content
				const xmlHttp = new XMLHttpRequest();
				xmlHttp.open("GET", auditPane, true);
				// Callback function to handle the response
				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState === XMLHttpRequest.DONE) {
						// Check if the request was successful
						if (xmlHttp.status === 200) {
							// Create a new div to hold the fetched HTML content
							const css = BuildStyleTag(browser.runtime.getURL("popup/popup.css"));
							const shared = BuildScriptTag(browser.runtime.getURL("tools/shared/shared.js"));
							const aaimg = BuildScriptTag(browser.runtime.getURL("img/aaimg.js"));

							// Build the script and style tags
							const js = BuildScriptTag(browser.runtime.getURL("tools/auditengine/auditengine.js"));
							//const css = BuildStyleTag(browser.runtime.getURL("engine/engine.css"));
							const doc = window.top.document.documentElement;
							// This clears the entire HTML content of the page
							doc.innerHTML = "";
							doc.innerHTML = xmlHttp.responseText;
							const body = window.top.document.querySelector('body[scroll=no]') || window.top.document.querySelector('body');
							body.appendChild(js);
							body.appendChild(shared);
							body.appendChild(aaimg);

							body.appendChild(css);
						} else if (xmlHttp.status === 400) {
							console.warn('There was an error 400');
						} else {
							console.warn('Something else other than 200 was returned');
						}
					}
				};
				xmlHttp.send(); // Send the request to load the audit HTML content
			} else {
				clearInterval(Interval.AuditControl.Pointer); // If `audithistory_app` exists, stop further attempts
			}
		}, 1000);  // Repeat the process every second (1000ms)
	}

	function Initialize_PluginTraceWebViewer() {



		const doc = window.top.document.documentElement;
		// This clears the entire HTML content of the page
		doc.innerHTML = "";
		Interval.AuditControl.Pointer = setInterval(function () {
			// Increment the number of attempts
			Interval.AuditControl.Count++;
			// Stop trying if the maximum number of attempts is reached
			if (Interval.AuditControl.Count > Interval.AuditControl.MaxTryCount) {
				clearInterval(Interval.AuditControl.Pointer);
				return;
			}
			// Check if the audit history app is already present in the document
			const audithistory_app = document.getElementById("XrmWebTools");
			// If not present, attempt to inject the required content
			if (!audithistory_app) {
				// Get the URL of the audit pane HTML template
				const auditPane = browser.runtime.getURL("tools/plugintraces/plugintraces.html");
				// Create a new XMLHttpRequest to fetch the HTML content
				const xmlHttp = new XMLHttpRequest();
				xmlHttp.open("GET", auditPane, true);
				// Callback function to handle the response
				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState === XMLHttpRequest.DONE) {
						// Check if the request was successful
						if (xmlHttp.status === 200) {
							// Create a new div to hold the fetched HTML content
							const css = BuildStyleTag(browser.runtime.getURL("popup/popup.css"));
							const shared = BuildScriptTag(browser.runtime.getURL("tools/shared/shared.js"));

							// Build the script and style tags
							const js = BuildScriptTag(browser.runtime.getURL("tools/plugintraces/plugintraces.js"));
							//const css = BuildStyleTag(browser.runtime.getURL("engine/engine.css"));
							const doc = window.top.document.documentElement;
							// This clears the entire HTML content of the page
							doc.innerHTML = "";
							doc.innerHTML = xmlHttp.responseText;
							const body = window.top.document.querySelector('body[scroll=no]') || window.top.document.querySelector('body');
							body.appendChild(js);
							body.appendChild(shared);

							body.appendChild(css);
						} else if (xmlHttp.status === 400) {
							console.warn('There was an error 400');
						} else {
							console.warn('Something else other than 200 was returned');
						}
					}
				};
				xmlHttp.send(); // Send the request to load the audit HTML content
			} else {
				clearInterval(Interval.AuditControl.Pointer); // If `audithistory_app` exists, stop further attempts
			}
		}, 1000);  // Repeat the process every second (1000ms)
	}

	function Initialize_SolutionHistory() {



		const doc = window.top.document.documentElement;
		// This clears the entire HTML content of the page
		doc.innerHTML = "";
		Interval.AuditControl.Pointer = setInterval(function () {
			// Increment the number of attempts
			Interval.AuditControl.Count++;
			// Stop trying if the maximum number of attempts is reached
			if (Interval.AuditControl.Count > Interval.AuditControl.MaxTryCount) {
				clearInterval(Interval.AuditControl.Pointer);
				return;
			}
			// Check if the audit history app is already present in the document
			const audithistory_app = document.getElementById("XrmWebTools");
			// If not present, attempt to inject the required content
			if (!audithistory_app) {
				// Get the URL of the audit pane HTML template
				const auditPane = browser.runtime.getURL("tools/solutionhistory/solutionhistory.html");
				// Create a new XMLHttpRequest to fetch the HTML content
				const xmlHttp = new XMLHttpRequest();
				xmlHttp.open("GET", auditPane, true);
				// Callback function to handle the response
				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState === XMLHttpRequest.DONE) {
						// Check if the request was successful
						if (xmlHttp.status === 200) {
							// Create a new div to hold the fetched HTML content
							const css = BuildStyleTag(browser.runtime.getURL("popup/popup.css"));
							const shared = BuildScriptTag(browser.runtime.getURL("tools/shared/shared.js"));

							// Build the script and style tags
							const js = BuildScriptTag(browser.runtime.getURL("tools/solutionhistory/solutionhistory.js"));
							//const css = BuildStyleTag(browser.runtime.getURL("engine/engine.css"));
							const doc = window.top.document.documentElement;
							// This clears the entire HTML content of the page
							doc.innerHTML = "";
							doc.innerHTML = xmlHttp.responseText;
							const body = window.top.document.querySelector('body[scroll=no]') || window.top.document.querySelector('body');
							body.appendChild(js);
							body.appendChild(shared);

							body.appendChild(css);
						} else if (xmlHttp.status === 400) {
							console.warn('There was an error 400');
						} else {
							console.warn('Something else other than 200 was returned');
						}
					}
				};
				xmlHttp.send(); // Send the request to load the audit HTML content
			} else {
				clearInterval(Interval.AuditControl.Pointer); // If `audithistory_app` exists, stop further attempts
			}
		}, 1000);  // Repeat the process every second (1000ms)
	}

	function Initialize_UsersLastLogin() {



		const doc = window.top.document.documentElement;
		// This clears the entire HTML content of the page
		doc.innerHTML = "";
		Interval.AuditControl.Pointer = setInterval(function () {
			// Increment the number of attempts
			Interval.AuditControl.Count++;
			// Stop trying if the maximum number of attempts is reached
			if (Interval.AuditControl.Count > Interval.AuditControl.MaxTryCount) {
				clearInterval(Interval.AuditControl.Pointer);
				return;
			}
			// Check if the audit history app is already present in the document
			const audithistory_app = document.getElementById("XrmWebTools");
			// If not present, attempt to inject the required content
			if (!audithistory_app) {
				// Get the URL of the audit pane HTML template
				const auditPane = browser.runtime.getURL("tools/userslastlogin/userslastlogin.html");
				// Create a new XMLHttpRequest to fetch the HTML content
				const xmlHttp = new XMLHttpRequest();
				xmlHttp.open("GET", auditPane, true);
				// Callback function to handle the response
				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState === XMLHttpRequest.DONE) {
						// Check if the request was successful
						if (xmlHttp.status === 200) {
							// Create a new div to hold the fetched HTML content
							const css = BuildStyleTag(browser.runtime.getURL("popup/popup.css"));
							const shared = BuildScriptTag(browser.runtime.getURL("tools/shared/shared.js"));

							// Build the script and style tags
							const js = BuildScriptTag(browser.runtime.getURL("tools/userslastlogin/userslastlogin.js"));
							//const css = BuildStyleTag(browser.runtime.getURL("engine/engine.css"));
							const doc = window.top.document.documentElement;
							// This clears the entire HTML content of the page
							doc.innerHTML = "";
							doc.innerHTML = xmlHttp.responseText;
							const body = window.top.document.querySelector('body[scroll=no]') || window.top.document.querySelector('body');
							body.appendChild(js);
							body.appendChild(shared);

							body.appendChild(css);
						} else if (xmlHttp.status === 400) {
							console.warn('There was an error 400');
						} else {
							console.warn('Something else other than 200 was returned');
						}
					}
				};
				xmlHttp.send(); // Send the request to load the audit HTML content
			} else {
				clearInterval(Interval.AuditControl.Pointer); // If `audithistory_app` exists, stop further attempts
			}
		}, 1000);  // Repeat the process every second (1000ms)
	}

	function Init() {
		try {

			
			const url = new URL(window.location.href);
			const dynamicsRegex = /^https?:\/\/.*\.dynamics\.com\/.*/;
			const IsDynamicsURL = url && dynamicsRegex.test(url);
			if (!IsDynamicsURL) { return; }
			if (window.location.href == `${url.origin}/xrmwebtools`) {
				Initialize_StartPage();
			} else if (window.location.pathname == `/xrmwebtools/auditengine`) {
				Initialize_AuditEngine();
			} else if (window.location.href == `${url.origin}/xrmwebtools/pluginregistration`) {
				Initialize_PluginRegistrationTool();
			} else if (window.location.href == `${url.origin}/xrmwebtools/plugintraces`) {
				Initialize_PluginTraceWebViewer();
			} else if (window.location.href == `${url.origin}/xrmwebtools/solutionhistory`) {
				Initialize_SolutionHistory();

			} else if (window.location.href == `${url.origin}/xrmwebtools/userslastlogin`) {
				Initialize_UsersLastLogin();
			}

		} catch (e) {

			//should never happen i guess
			return;

		}
	}



	// Start the initialization process
	Init();
})();