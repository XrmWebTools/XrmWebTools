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
let cachedUrl = "";
document.addEventListener('DOMContentLoaded', async function () {
	popup.UI.setImages();

	const url = await popup.QueryTab.GetURL();

	if (!popup.Validator.isDynamicsURL(url)) {
		// If the URL is not a Dynamics URL, check it 5 times with a 2-second delay
		checkUrlRetry(url, 5, 2000);
		return;
	}

	// If the URL is valid, proceed with initiating the popup
	initiatePopup(url);
});

// Function to retry checking the URL
async function checkUrlRetry(url, retries, delay) {
	const url_withouthttps = url ? url.origin.replace(/^https?:\/\//, '') : "";
	let retryCount = 0;
	document.getElementById("start_page_footertext").innerHTML = `Please open this tool from a  <a style="cursor:default" href="#" class="fw-bold">*://*.dynamics.com/*</a> page to use it. The current URL  <a style="cursor:default" href="#" class="fw-bold">${url_withouthttps}</a> is not a dynamics D365 page.`;

	const intervalId = setInterval(async () => {
		const newUrl = await popup.QueryTab.GetURL();

		if (popup.Validator.isDynamicsURL(newUrl)) {
			// If the URL becomes valid, clear the interval and handle the valid URL
			clearInterval(intervalId);
			initiatePopup(newUrl);
		} else {
			document.getElementById("start_page_footertext").innerHTML = `Please open this tool from a  <a style="cursor:default" href="#" class="fw-bold">*://*.dynamics.com/*</a> page to use it. The current URL  <a style="cursor:default" href="#" class="fw-bold">${url_withouthttps}</a> is not a dynamics D365 page.`;

			retryCount++;
			if (retryCount >= retries) {
				// If max retries reached, stop checking and display the error message
				clearInterval(intervalId);
			}
		}
	}, delay);
}

// Function to handle a valid Dynamics URL
function initiatePopup(url) {
	document.getElementById("start_page_footertext").innerHTML = `a lightweight, open source and powerful toolbox for <a style="cursor:default" href="#" class="fw-bold">Dynamics 365</a>`;
	cachedUrl = url;
	popup.UI.setConnectSpan(url);
	popup.UI.manageTabs();
	popup.UI.toggleOverlay(false);

	popup.Buttons.initToolBoxRedirects(url);
	popup.Buttons.initButtons();
	popup.Buttons.manageButtonLabels(url);
}

const popup = {

	Validator: {
		isDynamicsURL: function (url) {

			const dynamicsRegex = /^https?:\/\/.*\.dynamics\.com\/.*/;
			const IsDynamicsURL = url && dynamicsRegex.test(url);

			return IsDynamicsURL;
		}
	},
	UI: {
		setImages: function () {
			document.getElementById('toolbox_auditengine').src = chrome.runtime.getURL('img/XWT48.png');
			document.getElementById('toolbox_pluginregistration').src = chrome.runtime.getURL('img/XWT48.png');
			document.getElementById('toolbox_plugintracewebviewer').src = chrome.runtime.getURL('img/XWT48.png');
			document.getElementById('toolbox_solutionhistory').src = chrome.runtime.getURL('img/XWT48.png');
			document.getElementById('toolbox_userslastlogin').src = chrome.runtime.getURL('img/XWT48.png');
		},

		setConnectSpan: function (url) {
			const connectSpan = document.getElementById("connect");
			const urlOrigin = url.origin.replace(/^https?:\/\//, '');

			// Set the inner text and tooltip
			connectSpan.innerHTML = `Connected to: ${urlOrigin}`;
			connectSpan.title = `Connected to: ${urlOrigin}`;
		},

		manageTabs: function () {

			// List of button and corresponding content section IDs
			const tabs = [
				{ buttonId: "id_page_toolbox_link", contentId: "id_page_toolbox" },
				{ buttonId: "id_page_form_link", contentId: "id_page_form" },
				{ buttonId: "id_page_ribbon_link", contentId: "id_page_ribbon" },
				{ buttonId: "id_page_navigation_link", contentId: "id_page_navigation" },
				{ buttonId: "id_page_modheader_link", contentId: "id_page_modheader" },
			];

			// Function to handle tab switching
			function handleTabClick(event, selectedTab) {
				event.preventDefault();
				// Save the selected tab to localStorage
				localStorage.setItem('lastVisitedTab', selectedTab.buttonId);

				// Iterate through all tabs and update the classes
				tabs.forEach(tab => {
					const button = document.getElementById(tab.buttonId);
					const content = document.getElementById(tab.contentId);
					if (tab.buttonId === selectedTab.buttonId) {
						button.classList.add('active');
						button.classList.remove('font-regular');
						content.style.display = 'block'; // Show the content
					} else {
						button.classList.remove('active');
						button.classList.add('font-regular');
						content.style.display = 'none'; // Hide the content
					}
				});
			}

			// Add event listeners to all buttons
			tabs.forEach(tab => {
				document.getElementById(tab.buttonId).addEventListener("click", function (event) {
					handleTabClick(event, tab);
				});
			});

			// On page load, check for the last visited tab in localStorage
			const lastVisitedTabId = localStorage.getItem('lastVisitedTab');
			if (lastVisitedTabId) {
				// Find the corresponding tab object
				const lastVisitedTab = tabs.find(tab => tab.buttonId === lastVisitedTabId);
				if (lastVisitedTab) {
					// Simulate a click on the last visited tab
					handleTabClick(new Event('click'), lastVisitedTab);
				}
			} else {
				// If no tab is stored, default to the first tab
				handleTabClick(new Event('click'), tabs[0]);
			}
		},


		toggleOverlay: function (show) {
			const overlay = document.getElementById('overlay');
			if (show) {
				overlay.style.display = 'block'; // Or change 'block' to the appropriate value based on your layout
			} else {
				overlay.style.display = 'none';
			}
		},




	},
	QueryTab: {
		GetURL: async function () {
			try {
				if (!chrome || !chrome.tabs || !chrome.tabs.query) {
					return "";
				}

				// Get the active tab in the current window
				let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

				// Wrap chrome.scripting.executeScript in a Promise
				const result = await new Promise((resolve, reject) => {
					chrome.scripting.executeScript(
						{
							target: { tabId: tab.id },
							function: () => window.location.href, // Injected script logic
						},
						(injectionResults) => {
							if (chrome.runtime.lastError) {
								reject(chrome.runtime.lastError.message);
							} else if (injectionResults && injectionResults[0].result) {
								resolve(injectionResults[0].result);
							} else {
								reject("No result from injected script.");
							}
						}
					);
				});

				// Parse the URL and check the hostname
				const url = new URL(result);
				return url;
			} catch (e) {
				console.log("Error in IsDynamicsURL:", e);
				return "";
			}
		}
	},
	Buttons: {
		initToolBoxRedirects: function (url) {
			const data = popup.Helpers.GetEntityNameAndId(url);

			if (data.entityname && data.entityid) {
				document.getElementById("id_titel_auditengine365").textContent = `Audit Engine 365 for ${data.entityname}(${data.entityid})`;
			}
		


			document.getElementById("click_auditengine").addEventListener('click', () => {
			
				if (data.entityname && data.entityid) {
					window.open(`${url.origin}/xrmwebtools/auditengine?entityname=${data.entityname}&entityid=${data.entityid}`, '_blank');
				} else {
					window.open(`${url.origin}/xrmwebtools/auditengine`, '_blank');
				}
			
			});

			document.getElementById("click_pluginregistration").addEventListener('click', () => {
				window.open(`${url.origin}/xrmwebtools/pluginregistration`, '_blank');
			});

			document.getElementById("click_plugintracewebviewer").addEventListener('click', () => {
				window.open(`${url.origin}/xrmwebtools/plugintraces`, '_blank');
			});

			document.getElementById("click_solutionhistory").addEventListener('click', () => {
				window.open(`${url.origin}/xrmwebtools/solutionhistory`, '_blank');
			});

			document.getElementById("click_userslastlogin").addEventListener('click', () => {
				window.open(`${url.origin}/xrmwebtools/userslastlogin`, '_blank');
			});

		},

		initButtons: function () {
			//form
			document.getElementById('popup_godmode').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_godmode'));
			document.getElementById('popup_logicalnames').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_logicalnames'));
			document.getElementById('popup_recordid').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_recordid'));
			document.getElementById('popup_webapi').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_webapi'));
			document.getElementById('popup_changedfields').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_changedfields'));
			document.getElementById('popup_refreshform').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_refreshform'));
			document.getElementById('popup_refresh_autosaveoff').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_refresh_autosaveoff'));
			document.getElementById('popup_metadata').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_metadata'));
			document.getElementById('popup_oldformeditor').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_oldformeditor'));
			document.getElementById('popup_newformeditor').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_newformeditor'));

			//ribbon
			document.getElementById('popup_savechanges').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_savechanges'));
			document.getElementById('popup_saveandclose').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_saveandclose'));
			document.getElementById('popup_newrecord').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_newrecord'));
			document.getElementById('popup_deleterecord').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_deleterecord'));
			document.getElementById('popup_refreshribbon').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_refreshribbon'));
			document.getElementById('popup_debugribbon').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_debugribbon'));
			//navigation
			document.getElementById('popup_advancedfind').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_advancedfind'));
			document.getElementById('popup_systemsettings').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_systemsettings'));
			document.getElementById('popup_legacysecuritysettings').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_legacysecuritysettings'));
			document.getElementById('popup_allsolutions').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_allsolutions'));
			document.getElementById('popup_defaultsolution').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_defaultsolution'));

			document.getElementById('popup_opencreateform').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_opencreateform'));
			document.getElementById('popup_openrecordbyid').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_openrecordbyid'));
			document.getElementById('popup_openlist').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_openlist'));

			//mods
			document.getElementById('popup_darkmode').addEventListener('click', () => popup.Helpers.ClickPaneButton('contextmenu_darkmode'));
		},

		manageButtonLabels: function (url) {
			try {
				const params = popup.Helpers.GetEntityNameAndId(url);

				if (params.entityname) {
					document.getElementById('newrecordlabel').innerText = `New ${params.entityname}`;
					if (params.entityid) {
						document.getElementById('deleterecordlabel').innerText = `Delete ${params.entityname}`;
					}

				}
			} catch (e) {
			}

		},
	},
	Helpers: {

		GetEntityNameAndId: function (url) {
			let entityname = undefined;
			let entityid = undefined;

			// Check if the input is a string, convert it to a URL object if necessary
			if (typeof url === "string") {
				url = new URL(url); // Convert to URL object
			}

			// Extract search parameters
			const params = url.searchParams;

			if (url.href.includes("&pagetype=entitylist&etn=")) {
				entityname = params.get("etn");
			} else if (url.href.includes("&pagetype=entityrecord&etn=")) {
				entityname = params.get("etn");
				entityid = params.get("id");
				return { entityname, entityid };
			}

			return { entityname, entityid };
		},

		ClickPaneButton: async function (elementId) {

			try {
				if (!chrome || !chrome.tabs || !chrome.tabs.query) {
					console.warn("CRM not found");
					return;
				}

				let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

				chrome.scripting.executeScript({
					target: { tabId: tab.id },
					func: popup.Helpers.clickElementById,  // Use a named function
					args: [elementId]  // Pass the elementId as an argument
				});
				if (popup.close_popup_on_button_click) {
					window.close();
				}
			} catch (e) {
				//Nothing to see here, move along.
			}
		},

		clickElementById: function (elementId) {
			const ele = document.getElementById(elementId);

			if (ele) {
				ele.click();
			} else {
				console.warn(`element with id ${elementId} not found`);
			}
		}
	},
	close_popup_on_button_click: true,

}

document.addEventListener("DOMContentLoaded", () => {

	const button = document.getElementById("toggle_bypass_custom_plugin_execution");
	const mscrmInput = document.getElementById("mscrm_caller_id");
	const toggle_imp = document.getElementById("toggle_impersonation");

	//Onload, set checkbox toggleImpersonation and input value guid
	chrome.storage.local.get(["headersEnabled", "MSCRMCallerID"], (result) => {
		const enabled = result.headersEnabled || false;
		const mscrmCallerID = result.MSCRMCallerID || '';
		button.checked = enabled;
		mscrmInput.value = mscrmCallerID;

		if (mscrmCallerID) {
			toggle_imp.checked = true;
		} else {
			toggle_imp.checked = false;
		}
	});

	//when toggleImpersonation changes,... 
	button.addEventListener("click", () => {
		chrome.storage.local.get(["headersEnabled"], (result) => {
			const enabled = result.headersEnabled || false;
			const newState = !enabled;

			chrome.storage.local.set({ headersEnabled: newState }, () => {
				button.checked = newState;
			});
		});
	});

	// MSCRMCallerID input change handler
	mscrmInput.addEventListener("input", () => {
		const mscrmCallerIDValue = mscrmInput.value;
		
		chrome.storage.local.set({ MSCRMCallerID: mscrmCallerIDValue }, () => {
			console.log("MSCRMCallerID updated:", mscrmCallerIDValue);
		});
	});

	document.getElementById("toggle_impersonation").addEventListener('click', () => {
		const checked = document.getElementById("toggle_impersonation").checked;

		if (checked && !mscrmInput.value) {
			//check if inputbox has value
			const temp = popup.Helpers.GetEntityNameAndId(cachedUrl);
			const onExistingUserForm = temp.entityname == "systemuser" && temp.entityid;
			if (!onExistingUserForm) {
				alert("Please open an existing user form first");
				document.getElementById("toggle_impersonation").checked = false;
				return;
			}
			mscrmInput.value = temp.entityid;
			chrome.storage.local.set({ MSCRMCallerID: temp.entityid }, () => {
				console.log("MSCRMCallerID updated:", temp.entityid);
			});
		} else if (!checked && mscrmInput.value) {
			mscrmInput.value = "";
			chrome.storage.local.set({ MSCRMCallerID: "" }, () => {
				console.log("MSCRMCallerID updated:", "");
			});
		}
	});

	//SETTING - WIZARD
	const toggle_wizard = document.getElementById("iamawizard");
	chrome.storage.local.get(["XrmWebTools_Settings_IAmAWizard"], (result) => {

		toggle_wizard.checked = !!result.XrmWebTools_Settings_IAmAWizard;
		try {
			//this is in smoke.js
			manageStyleTag();

		} catch (e) {
			console.log("smoke.js not found")
		}
	});
	toggle_wizard.addEventListener("change", () => {
		chrome.storage.local.set({ XrmWebTools_Settings_IAmAWizard: toggle_wizard.checked });

	});

	//SETTING - CLOSE POPUP
	const button_close_popup = document.getElementById("toggle_close_popup_on_button_click");
	chrome.storage.local.get(["XrmWebTools_Settings_Close_Popup"], (result) => {

		button_close_popup.checked = !!result.XrmWebTools_Settings_Close_Popup;
		popup.close_popup_on_button_click = !!result.XrmWebTools_Settings_Close_Popup;
	});
	button_close_popup.addEventListener("change", () => {

		popup.close_popup_on_button_click = button_close_popup.checked;
		chrome.storage.local.set({ XrmWebTools_Settings_Close_Popup: button_close_popup.checked });
	});
});