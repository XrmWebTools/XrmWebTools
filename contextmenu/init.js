/*******************************************************************************
 * 
	XrmWebTools – Boost Productivity for Dynamics 365.
	Copyright (C) 2024-present Yenthe Rossel

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see {http://www.gnu.org/licenses/}.

	Home: https://github.com/XrmWebTools
*/
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