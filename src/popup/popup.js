// Function to be injected into the webpage
function clickElementById(elementId) {
	const ele = document.getElementById(elementId);

	if (ele) {
		ele.click();
	} else {
		console.warn("CRM not found.");
	}
}

async function setWelcomeText() {
	try {
		if (!chrome || !chrome.tabs || !chrome.tabs.query) {
			console.warn("CRM not found");
			return;
		}

		let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

		chrome.scripting.executeScript({
			target: { tabId: tab.id },
			func: clickElementById,  // Use a named function
			args: ["username"]  // Pass the elementId as an argument
		});



		let username = "";

		// Use chrome.scripting.executeScript to run the function in the target tab
		chrome.scripting.executeScript(
			{
				target: { tabId: tab.id },
				function: () => {
					// This function will be executed in the context of the target tab
					const ele = document.getElementById("username");
					if (ele) {
						return ele.innerHTML; // Return the innerHTML of the #username element
					}
					return ""; // Return an empty string if element is not found
				},
			},
			(injectionResults) => {

				
				// Retrieve the result from the executed script
				if (injectionResults && injectionResults[0].result) {

					username = injectionResults[0].result;
					let firstWord = typeof username === 'string' ? username.trim().split(" ")[0] : "";
					let lastWord = typeof username === 'string' ? username.trim().split(" ").pop() : "";

					// Update the #helloworld element in the current document
					const hour = new Date().getHours();

					const welcomeTypes = [`Good morning, ${firstWord}!`, `Good afternoon, ${firstWord}!`, `Good evening, ${firstWord}!`];
					let welcomeText = "";

					if (hour < 12) welcomeText = welcomeTypes[0];
					else if (hour < 18) welcomeText = welcomeTypes[1];
					else welcomeText = welcomeTypes[2];

					if (username == "UserName") {
						welcomeText = "Popup is disabled"
					}

					document.getElementById("helloworld").innerHTML = `<span class="d-inline-block me-3">👋</span>${welcomeText}`;

				} else {
					// Handle the case where the username is not found
					console.log("Username element not found.");
				}
			}
		);


	} catch (e) {

		console.warn("Nothing to see here, move along.")
	}
}

setWelcomeText();

//var openXrmToolboxButton = document.getElementById("openxrmtoolbox");

//// Add click event listener
//openXrmToolboxButton.addEventListener("click", async function () {
//	await ClickPaneButton();
//	// Display an alert with a greeting
//	alert("Hi");
//	// Optionally, you can also perform other actions here
//	// For example, opening a URL
//	// window.open("URL_TO_XRMTOOLBOX", "_blank");
//});
setImages();
function setImages() {
	document.getElementById('img_logicalnames').src = chrome.runtime.getURL('img/action-icons/crmpp-logicalnames-icon.png');

	document.getElementById('img_godmode').src = chrome.runtime.getURL('img/action-icons/crmpp-godmode-icon.png');
	document.getElementById('img_darkmode').src = chrome.runtime.getURL('img/action-icons/crmpp-darkmode-icon.png');

	document.getElementById('img_openadvfind').src = chrome.runtime.getURL('img/action-icons/crmpp-advfind-icon.png');

	document.getElementById('img_auditengine').src = chrome.runtime.getURL('img/action-icons/audit48.png');
	document.getElementById('img_plugintraceviewer').src = chrome.runtime.getURL('img/action-icons/XWT48.png');
	document.getElementById('img_solutionhistory').src = chrome.runtime.getURL('img/action-icons/XWT48.png');
	document.getElementById('img_userslastlogin').src = chrome.runtime.getURL('img/action-icons/XWT48.png');

}


document.getElementById('opentoolbox').addEventListener('click', () => ClickPaneButton('openxrmwebtools'));

document.getElementById('popup_godmode').addEventListener('click', () => ClickPaneButton('rbl_godmode'));
document.getElementById('popup_logicalnames').addEventListener('click', () => ClickPaneButton('rbl_logicalnames'));
document.getElementById('popup_darkmode').addEventListener('click', () => ClickPaneButton('rbl_darkmode'));
document.getElementById('popup_openadvfind').addEventListener('click', () => ClickPaneButton('rbl_advancedfind'));


document.getElementById('popup_auditengine').addEventListener('click', () => ClickPaneButton('openxrmwebtools_today'));
document.getElementById('popup_plugintraceviewer').addEventListener('click', () => ClickPaneButton('openxrmwebtools_plugins'));
document.getElementById('popup_solutionhistory').addEventListener('click', () => ClickPaneButton('openxrmwebtools_solutions'));
document.getElementById('popup_userslastlogin').addEventListener('click', () => ClickPaneButton('openxrmwebtools_users'));





async function ClickPaneButton(elementId) {

	try {
		if (!chrome || !chrome.tabs || !chrome.tabs.query) {
			console.warn("CRM not found");
			return;
		}

		let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

		chrome.scripting.executeScript({
			target: { tabId: tab.id },
			func: clickElementById,  // Use a named function
			args: [elementId]  // Pass the elementId as an argument
		});

	} catch (e) {
		//Nothing to see here, move along.
	}

}