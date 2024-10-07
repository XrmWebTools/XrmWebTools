(function () {

	if (typeof browser === "undefined") {
		browser = chrome;
	}

	Interval = {
		RightBodyLinksControl: {
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

	function InjectSource(sources) {

		var isRightBodyLinksInjected = Array.from(window.top.document.scripts).find(function (elem) { return elem.src.indexOf("rightbodylinks.js") > -1 });

		if (isRightBodyLinksInjected != undefined) { 
			return;
		}

		body = window.top.document.querySelector('body[scroll=no]') || window.top.document.querySelector('body');

		sources.forEach(function (s) {
			body.appendChild(s);
		});
	}

	function InitializeRightBodyLinks() {

		Interval.RightBodyLinksControl.Pointer = setInterval(function () {

			Interval.RightBodyLinksControl.Count++;
			if (Interval.RightBodyLinksControl.Count > Interval.RightBodyLinksControl.MaxTryCount) {
				clearInterval(Interval.RightBodyLinksControl.Pointer);
			}

			var rightBodyLinks = document.getElementById("rightBodyLinks");

			if (!rightBodyLinks) {
			
				var powerPaneTemplate = browser.runtime.getURL("rightbodylinks/rightbodylinks.html");

				xmlHttp = new XMLHttpRequest();
				xmlHttp.open("GET", powerPaneTemplate, true);

				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState == XMLHttpRequest.DONE) {
						if (xmlHttp.status == 200) {
							var content = document.createElement("div");
							content.innerHTML = xmlHttp.responseText
							content.id = "rightBodyLinks";
							var script = BuildScriptTag(browser.runtime.getURL("rightbodylinks/rightbodylinks.js"));
							InjectSource([ script, content]);

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
				clearInterval(Interval.RightBodyLinksControl.Pointer);
			}
		}, 1000);
	}
	InitializeRightBodyLinks();
})();