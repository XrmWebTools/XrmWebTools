
(function () {

	if (typeof browser === "undefined") {
		browser = chrome;
	}

	Interval = {
		contextmenuControl: {
			Pointer: undefined,
			Count: 0,
			MaxTryCount: 10
		}
	}

	function BuildScriptTag(source) {
		var script = document.createElement("script");
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('src', source);
		return script;
	}
	function BuildStyleTag(source) {
		const style = document.createElement('link');
		style.setAttribute('rel', 'stylesheet');
		style.setAttribute('type', 'text/css');
		style.setAttribute('href', source); // Correct attribute is `href` for stylesheets
		return style;
	}

	function InjectSource(sources) {

		var iscontextmenuInjected = Array.from(window.top.document.scripts).find(function (elem) { return elem.src.indexOf("contextmenu.js") > -1 });

		if (iscontextmenuInjected != undefined) { 
			return;
		}

		body = window.top.document.querySelector('body[scroll=no]') || window.top.document.querySelector('body');

		sources.forEach(function (s) {
			body.appendChild(s);
		});
	}

	function Initializecontextmenu() {

		if (decodeURIComponent(window.location.href).includes('xrmwebtools')) {

			return;
		}

		Interval.contextmenuControl.Pointer = setInterval(function () {

			Interval.contextmenuControl.Count++;
			if (Interval.contextmenuControl.Count > Interval.contextmenuControl.MaxTryCount) {
				clearInterval(Interval.contextmenuControl.Pointer);
			}

			var contextmenu = document.getElementById("contextmenu");

			if (!contextmenu) {
			
				var powerPaneTemplate = browser.runtime.getURL("contextmenu/contextmenu.html");

				xmlHttp = new XMLHttpRequest();
				xmlHttp.open("GET", powerPaneTemplate, true);

				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState == XMLHttpRequest.DONE) {
						if (xmlHttp.status == 200) {
							var content = document.createElement("div");
							content.innerHTML = xmlHttp.responseText
							content.id = "contextmenu";
							var script = BuildScriptTag(browser.runtime.getURL("contextmenu/contextmenu.js"));
							var css = BuildStyleTag(browser.runtime.getURL("contextmenu/contextmenu.css"));

							InjectSource([css, content, script]);
							
						
						}
						else if (xmlHttp.status == 400) {
							console.error('There was an error 400');
						}
						else {
							console.error('something else other than 200 was returned');
						}
					}
				};
				xmlHttp.send();
			} else {
				clearInterval(Interval.contextmenuControl.Pointer);
			}
		}, 1000);
	}
	Initializecontextmenu();
})();