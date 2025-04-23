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
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program. If not, see <http://www.gnu.org/licenses/>.

	Home: https://github.com/XrmWebTools
	License: https://www.gnu.org/licenses/gpl-3.0.html
*/
console.clear();
console.info("XWT: Hi!");
setTimeout(() => { document.getElementById("XrmWebTools").style.display = "block" }, 50);

const XRMWebTools = {

	WebApi: {
		// Method to retrieve data with a custom filter
		RetrieveWithCustomFilter: async function (urlEnding) {
			const clientURL = window.location.origin;
			const requestURL = `${clientURL}/api/data/v9.2/${urlEnding}`;

			try {
				const response = await fetch(requestURL, {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json; charset=utf-8',
						'OData-MaxVersion': '4.0',
						'OData-Version': '4.0',
						'Prefer': 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
					}
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				return data;
			} catch (error) {
				console.error(`Error retrieving data: ${error.message}`);
				throw error; // Optionally rethrow to handle elsewhere
			}
		},

		Retrieve: function (entityName, id, cols = null, keyAttribute = null) {
			if (!keyAttribute) {
				keyAttribute = entityName + "id";
			}

			if (entityName.substr(entityName.length - 1) == "y"
				&& !entityName.endsWith('journey'))
				entityName = entityName.substr(0, entityName.length - 1) + "ies";
			else
				entityName = entityName + "s";

			id = id.replace(/[{}]/g, "").toLowerCase();

			var select = "$select=" + keyAttribute;

			if (cols) {
				select += ",";
				select += cols.join(',');
			}

			var req = new XMLHttpRequest();
			var clientURL = window.location.origin;
			req.open("GET", encodeURI(clientURL + "/api/data/v9.2/" + entityName + "(" + id + ")?" + select), false);
			req.setRequestHeader("Accept", "application/json");
			req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
			req.setRequestHeader("OData-MaxVersion", "4.0");
			req.setRequestHeader("OData-Version", "4.0");
			req.setRequestHeader("Prefer", 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"');
			req.send(null);
			return JSON.parse(req.responseText);
		},

		ExecuteGlobalAction: function (customActionName, parameters) {
			return new Promise((resolve, reject) => {
				var req = new XMLHttpRequest();
				req.open("POST", window.location.origin + "/api/data/v9.2/" + customActionName, true);
				req.setRequestHeader("Accept", "application/json");
				req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
				req.setRequestHeader("OData-MaxVersion", "4.0");
				req.setRequestHeader("OData-Version", "4.0");
				req.onreadystatechange = function () {
					if (this.readyState === 4) {
						req.onreadystatechange = null;
						if (this.status === 200) {
							var output = JSON.parse(this.response);
							resolve(output);
						} else {
							reject(this.statusText);
						}
					}
				};
				req.send(JSON.stringify(parameters));
			});
		},

		UpdateAsync: async function (urlEnding, entity) {
			return new Promise((resolve, reject) => {
				const req = new XMLHttpRequest();
				const clientURL = window.location.origin;
				const fullUrl = `${clientURL}/api/data/v9.2/${urlEnding}`;

				req.open("PATCH", fullUrl, true);
				req.setRequestHeader("OData-MaxVersion", "4.0");
				req.setRequestHeader("OData-Version", "4.0");
				req.setRequestHeader("Accept", "application/json");
				req.setRequestHeader("Content-Type", "application/json; charset=utf-8");

				req.onreadystatechange = function () {
					if (req.readyState === 4) {
						if (req.status === 204) {
							// Success - No Return Data
							resolve(true);
						} else {
							// Error - Reject with response text
							reject(req.responseText);
						}
					}
				};

				req.send(JSON.stringify(entity));
			});
		},

		CreateAsync: async function (entityName, entity) {
			return new Promise((resolve, reject) => {
				entityName = entityName + "s";
				const clientURL = window.location.origin;

				var req = new XMLHttpRequest();
				req.open("POST", clientURL + "/api/data/v9.2/" + entityName, true);
				req.setRequestHeader("Accept", "application/json");
				req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
				req.setRequestHeader("OData-MaxVersion", "4.0");
				req.setRequestHeader("OData-Version", "4.0");
				req.onreadystatechange = function () {
					if (this.readyState === 4) {
						req.onreadystatechange = null;
						if (this.status === 204) {
							//Success - Return Data - EntityId
							var result = this.getResponseHeader("OData-EntityId")
							var entityId = result.split(entityName)[1].replace(/[()]/g, "").toLowerCase();
							resolve(entityId);
						}
						else {
							reject(JSON.parse(this.response));
						}
					}
				};
				req.send(JSON.stringify(entity));
			});
		}
	},
	CONFIG: {
		baseUrl: 'https://github.com/auditengine/',
		getUrl_naam: () => {
			return `${XRMWebTools.CONFIG.baseUrl}auditengine/issues`;
		},
		organizationid: "",
		currenttracelogsetting: "",
		openAttribute(attributeId, entityId) {
			const url = `${window.location.origin}/tools/systemcustomization/attributes/manageAttribute.aspx?attributeId=%7b${attributeId}%7d&entityId=%7b${entityId}%7d&appSolutionId=%7bFD140AAF-4DF4-11DD-BD17-0019B9312238%7d`;

			XRMWebTools.CONFIG.openPopup(url);
		},

		openPopup(url, popupWidth = 800, popupHeight = 600) {
			const { screenLeft, screenTop, innerWidth, innerHeight } = window;
			const { clientWidth, clientHeight } = document.documentElement;

			const screenWidth = innerWidth || clientWidth || screen.width;
			const screenHeight = innerHeight || clientHeight || screen.height;

			const left = (screenWidth / 2) - (popupWidth / 2) + (screenLeft || window.screenX);
			const top = (screenHeight / 2) - (popupHeight / 2) + (screenTop || window.screenY);

			const popupFeatures = `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`;

			window.open(url, '_blank', popupFeatures);
		},
		openInDefaultSolution(entityName) {
			if (!entityName || entityName.trim() === "") return;
			alert("entityName")
			//const entityTypeCode = Xrm.Internal.getEntityCode(entityName);
			//if (!entityTypeCode) return;

			//const defaultSolutionId = "{FD140AAF-4DF4-11DD-BD17-0019B9312238}";
			//const entityDetail = `&def_category=9801&def_type=${entityTypeCode}`;

			//AuditApp.UI.openPopup(
			//	`${Xrm.Page.context.getClientUrl()}/tools/solution/edit.aspx?id=${defaultSolutionId}${entityDetail}`
			//);
		},
	},
	
	
	toggleOverlay: function (show, type = "", message = "") {
		const overlay = document.getElementById('overlay');
		//const messageElement = document.getElementById('app_info_message');

		if (show) {
			overlay.style.display = 'block';  // Show the overlay

		} else {
			overlay.style.display = 'none';  // Hide the overlay
		}
	},
	
	Panel4: {
		/**
		 * Retrieves plugin traces based on user input and applies filters.
		 */
		PluginTraces: async () => {
			const top = 5000; // Maximum number of records to retrieve
			let filter = "$filter="; // Initialize filter string

			// Retrieve user input values
			let from = document.getElementById("plugintracelog_from").value;
			const plugintracelog_message_create = document.getElementById("plugintracelog_message_create").checked;
			const plugintracelog_message_update = document.getElementById("plugintracelog_message_update").checked;
			const plugintracelog_message_associate = document.getElementById("plugintracelog_message_associate").checked;
			let plugintracelog_entity = document.getElementById("plugintracelog_entity").value;
			const plugintracelog_message_exceptiononly = document.getElementById("plugintracelog_message_exceptiononly").checked;

			// Construct filter based on user input
			if (plugintracelog_message_exceptiononly) {
				filter += (filter !== "$filter=" ? " and " : "") + "exceptiondetails ne ''";
			}
			if (plugintracelog_entity) {
				filter += (filter !== "$filter=" ? " and " : "") + `primaryentity eq '${plugintracelog_entity}'`;
			}
			if (plugintracelog_message_create) {
				filter += (filter !== "$filter=" ? " and " : "") + "messagename eq 'Create'";
			}
			if (plugintracelog_message_update) {
				filter += (filter !== "$filter=" ? " and " : "") + "messagename eq 'Update'";
			}
			if (plugintracelog_message_associate) {
				filter += (filter !== "$filter=" ? " and " : "") + "messagename eq 'Associate'";
			}
			if (from) {
				const fromDate = new Date(from);
				fromDate.setHours(0, 0, 0, 0); // Set time to the start of the day
				from = `createdon gt ${fromDate.toISOString()}`; // Format as ISO date
			}
			if (from) {
				filter += (filter !== "$filter=" ? " and " : "") + from;
			}

			// Adjust filter if no conditions are applied
			filter = filter === "$filter=" ? "" : filter + "&";

			try {
				// Retrieve plugin traces with applied filters
				const plugintraces = await XRMWebTools.WebApi.RetrieveWithCustomFilter(
					`plugintracelogs?${filter}$top=${top}&$orderby=performanceconstructorstarttime desc`
				);
				console.log("plugintraces", plugintraces);
				XRMWebTools.Panel4.renderPluginLogs(plugintraces.value);
				document.getElementById("pane4_plugintraces").innerHTML = "Refresh Plugin Traces";
			} catch (e) {
				// Handle and display errors
				alert(e.message);
			}
		},

		/**
		 * Renders the retrieved plugin logs into the table.
		 * @param {Array} data - Array of plugin log objects to be displayed.
		 */
		renderPluginLogs: (data) => {
			/**
			 * Formats a date string into a more readable format.
			 * @param {string} dateString - ISO date string to format.
			 * @returns {string} - Formatted date string.
			 */
			function formatDate(dateString) {
				if (!dateString) return 'N/A';
				const date = new Date(dateString);
				return date.toLocaleString();
			}

			/**
			 * Shortens a string to a specified length and appends ellipsis if necessary.
			 * @param {string} input - String to be shortened.
			 * @returns {string} - Shortened string with ellipsis.
			 */
			function shortenString(input) {
				return input.length > 62 ? input.slice(0, 62) + '...' : input;
			}

			/**
			 * Extracts useful information from an error message.
			 * @param {string} errorMessage - Full error message.
			 * @returns {string} - Extracted useful information.
			 */
			function extractUsefulInfo(errorMessage) {
				// Regular expression to capture the useful part of the error message
				const regex = /System\.ServiceModel\.FaultException`1\[Microsoft\.Xrm\.Sdk\.OrganizationServiceFault\]:\s*(.*?)\s*\(Fault Detail is equal to Exception details:/s;
				const match = errorMessage.match(regex);
				return match ? match[1].trim() : errorMessage;
			}

			// Get references to the necessary DOM elements
			const mainList = document.getElementById('ID_PLUGINLOGS_MAINLIST');
			const countElement = document.getElementById('ID_PLUGINLOGS_COUNT');

			// Check if data exists and is an array
			if (!data || !Array.isArray(data)) {
				console.error('Invalid data format');
				return;
			}

			// Clear existing table rows
			mainList.innerHTML = '';

			// Iterate over the array and create table rows
			data.forEach(item => {
				const row = document.createElement('tr');

				// Extract and format data for each row
				const startdatetime = formatDate(item.performanceconstructorstarttime);
				const duration = item.performanceexecutionduration || '';
				const operation = item["operationtype@OData.Community.Display.V1.FormattedValue"] || 'N/A';
				let typename = shortenString(item.typename || '');
				const messagename = item.messagename || '';
				const depth = item.depth || '';
				const mode = item["mode@OData.Community.Display.V1.FormattedValue"] || 'N/A';
				let exception = extractUsefulInfo(item.exceptiondetails || '');

				// Set row content
				row.innerHTML = `
                <td>${startdatetime}</td>
                <td>${duration}</td>
                <td class="d-none d-xl-table-cell">${operation}</td>
                <td class="d-none d-xl-table-cell">${typename}</td>
                <td>${messagename}</td>
                <td>${depth}</td>
                <td>${mode}</td>
                <td>${item.primaryentity}</td>
                <td>${exception}</td>
            `;

				// Append the row to the main list
				mainList.appendChild(row);
			});

			// Update count element with the number of logs retrieved
			countElement.textContent = data.length ? `${data.length} plugin logs retrieved.` : '0 plugin logs found';
		},

		Setting: async () => {

			// Function to select an option from a dropdown
			function selectOption(value) {
				// Find the select element by its ID
				const selectElement = document.getElementById('pane4_settingddl');

				// Check if the select element exists
				if (selectElement) {
					// Set the value of the select element to the provided value
					selectElement.value = value;
				} else {
					// Log an error if the select element is not found
					console.error('Select element not found.');
				}
			}

			// Check if the content of the element with ID 'pane4_setting' is "Set"
			if (document.getElementById("pane4_setting").innerHTML === "Set") {


				const settingddl_value = document.getElementById('pane4_settingddl').value;
				//alert(settingddl_value)
				if (settingddl_value == XRMWebTools.CONFIG.currenttracelogsetting) {
					alert("This is already the current setting");
					return;
				}
				let setting = -1;
				switch (settingddl_value) {
					case "Off":
						setting = 0;
						break;
					case "Exception":
						setting = 1;
						break;
					case "All":
						setting = 2;
						break;
				}

				if (setting == -1) {
					alert("Setting value is not set to 'Off' or 'Exception' or 'All'");
					return;
				}
				if (!XRMWebTools.CONFIG.organizationid) {
					alert("organizationid is not set");
					return;
				}


				await XRMWebTools.WebApi.UpdateAsync(`organizations(${XRMWebTools.CONFIG.organizationid})`, { "plugintracelogsetting": setting, });

				XRMWebTools.CONFIG.currenttracelogsetting = settingddl_value;
				return;
			}

			// Retrieve data from the web API with a custom filter
			const orgs = await XRMWebTools.WebApi.RetrieveWithCustomFilter(
				`organizations?$select=plugintracelogsetting`
			);

			// Check if the retrieved data is valid and contains at least one item
			if (orgs && orgs.value && orgs.value[0]) {
				// Extract the formatted value of 'plugintracelogsetting'
				const plugintracelogsetting = orgs.value[0]["plugintracelogsetting@OData.Community.Display.V1.FormattedValue"];
				XRMWebTools.CONFIG.organizationid = orgs.value[0]["organizationid"];
				XRMWebTools.CONFIG.currenttracelogsetting = plugintracelogsetting;

				// Check if 'plugintracelogsetting' is defined
				if (plugintracelogsetting) {
					// Select the option with the value of 'plugintracelogsetting'
					selectOption(plugintracelogsetting);

					// Update the content of the element with ID 'pane4_setting' to "Set"
					document.getElementById("pane4_setting").innerHTML = "Set";
				}
			}
		},

	},
	
	RegisterEvents: async function () {

		console.log("XWT: RegisterEvents");
		document.getElementById("pane4_plugintraces").addEventListener("click", async function (event) {
			// Prevent the default anchor behavior (e.g., scrolling to top)
			event.preventDefault();
			XRMWebTools.toggleOverlay(true, "Retrieving", "Plugin Traces");
			await XRMWebTools.Panel4.PluginTraces();
			XRMWebTools.toggleOverlay(false);
		});

		document.getElementById("pane4_setting").addEventListener("click", async function (event) {
			// Prevent the default anchor behavior (e.g., scrolling to top)
			event.preventDefault();
			XRMWebTools.toggleOverlay(true, "Retrieving", "Setting");
			await XRMWebTools.Panel4.Setting();
			XRMWebTools.toggleOverlay(false);
		});

		return;




		


		



		



	},
}

XRMWebTools.RegisterEvents();

