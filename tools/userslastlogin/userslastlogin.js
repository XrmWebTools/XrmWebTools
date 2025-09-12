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

		RetrieveAllAuditsFromTodayWithCustomFilter: async function (hour = 3, filter = "", top = "", retrieveAll = true) {
			const clientUrl = window.location.origin;//Xrm.Page.context.getClientUrl();
			const startOfToday = new Date();
			startOfToday.setHours(hour, 0, 0, 0); // Set time to 3:00 AM today
			const filterDate = startOfToday.toISOString();

			if (filter) {
				filter = ` and ${filter}`;
			}
			if (top) {
				top = `&$top=${top}`;
			}

			let nextLink = `${clientUrl}/api/data/v9.1/audits?$filter=createdon gt ${filterDate}${filter}&$orderby=createdon desc${top}`;
			let allAudits = [];
			let nextLinkRetrievalCount = 0; // Counter to track nextLink retrievals
			const maxRetrievals = 5; // Limit the number of nextLink retrievals to 5

			while (nextLink && nextLinkRetrievalCount < maxRetrievals) {
				console.log(`Retrieving audits from: ${nextLink}`); // Log the current nextLink
				nextLinkRetrievalCount++; // Increment the counter

				const auditResponse = await fetch(nextLink, {
					headers: {
						"OData-MaxVersion": "4.0",
						"OData-Version": "4.0",
						"Accept": "application/json",
						"Content-Type": "application/json; charset=utf-8",
						"Prefer": 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',

					}
				});

				if (!auditResponse.ok) {
					throw new Error(`Error retrieving audits: ${auditResponse.statusText}`);
				}

				const auditData = await auditResponse.json();
				allAudits = allAudits.concat(auditData.value);
				nextLink = retrieveAll ? (auditData['@odata.nextLink'] || null) : null;
			}

			// Log the total number of times nextLink was retrieved
			console.log(`Total nextLink retrievals: ${nextLinkRetrievalCount}`);

			return allAudits;
		},

		//Todo: remove this one and expand above method!
		RetrieveAllAuditsWithCustomFilter: async function (filter = "") {
			const clientUrl = window.location.origin;
			let nextLink = `${clientUrl}/api/data/v9.1/audits?${filter}`;
			let allAudits = [];

			while (nextLink) {
				const auditResponse = await fetch(nextLink, {
					headers: {
						"OData-MaxVersion": "4.0",
						"OData-Version": "4.0",
						"Accept": "application/json",
						"Content-Type": "application/json; charset=utf-8",
						"Prefer": 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',

					}
				});

				if (!auditResponse.ok) {
					throw new Error(`Error retrieving audits: ${auditResponse.statusText}`);
				}

				const auditData = await auditResponse.json();
				allAudits = allAudits.concat(auditData.value);
				nextLink = auditData['@odata.nextLink'] || null;
			}

			return allAudits;
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

	StringHelpers: {
		formatIfJson: function formatIfJson(str) {
			try {
				// Attempt to parse the string as JSON
				const jsonObject = JSON.parse(str);

				// If it's valid JSON, return a formatted (pretty-printed) version
				return JSON.stringify(jsonObject, null, 4);  // 4 spaces indentation for readability
			} catch (e) {
				// If the string is not valid JSON, return the original string
				return str;
			}
		},
		// Function to format the date string into a readable format
		formatDateString: (dateString) => {
			// Parse the input string into a Date object
			const date = new Date(dateString);

			// Define month names
			const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			const month = monthNames[date.getMonth()];

			// Get day and time portions
			const day = date.getDate();
			const time = dateString.split('T')[1].split('Z')[0];

			// Return formatted date string
			return `${month} ${day}, ${time}`;
		}
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

	Panel2: {

		// Initial properties
		columns: null,
		users: null,

		// Asynchronous function to retrieve system views
		RetrieveSystemViews: async () => {
			try {
				// Fetch system views with a filter for systemuser
				const views = await XRMWebTools.WebApi.RetrieveWithCustomFilter("savedqueries?$filter=returnedtypecode eq 'systemuser'");

				// Extract relevant details from views
				const names = views.value.map(view => ({
					name: view.name,
					savedqueryid: view.savedqueryid,
					layoutjson: extractColumnHeaders(view.layoutjson)
				}));

				// Append views to the dropdown menu
				await XRMWebTools.Panel2.appendViewsToDropdown(names);
			} catch (error) {
				console.error('Error retrieving system views:', error);
			}

			// Helper function to extract column headers from layout JSON
			function extractColumnHeaders(jsonString) {
				try {
					// Parse JSON string to object
					const data = JSON.parse(jsonString);

					// Check data structure and extract headers
					if (data && data.Rows && data.Rows.length > 0 && data.Rows[0].Cells) {
						const headers = data.Rows[0].Cells.map(cell => cell.Name);
						const updatedHeaders = ["Last_Login", ...headers];
						return updatedHeaders;
					} else {
						return [];
					}
				} catch (error) {
					console.error('Error parsing JSON for column headers:', error);
					return [];
				}
			}
		},

		// Asynchronous function to append views to the dropdown menu
		appendViewsToDropdown: async (views) => {
			const dropdownMenu = document.getElementById('listofviews');
			dropdownMenu.innerHTML = ''; // Clear existing items

			views.forEach(view => {
				// Create and configure new anchor element for each view
				const viewLink = document.createElement('a');
				viewLink.className = 'dropdown-item d-flex gap-3 align-items-center position-relative';
				viewLink.id = `view_${view.savedqueryid}`; // Use savedqueryid for unique ID

				// Create and append span for view name
				const viewNameSpan = document.createElement('span');
				viewNameSpan.textContent = view.name;
				viewLink.appendChild(viewNameSpan);

				// Add click event listener
				viewLink.addEventListener('click', async () => {
					await XRMWebTools.Panel2.onViewClick(view.savedqueryid, view.name, view.layoutjson);
				});

				// Append anchor to dropdown menu
				dropdownMenu.appendChild(viewLink);
			});

			// Optionally trigger a view click for a specific view
			const enabled = views.filter(v => v.name === "Enabled Users");
			if (enabled.length > 0) {
				await XRMWebTools.Panel2.onViewClick(enabled[0].savedqueryid, enabled[0].name, enabled[0].layoutjson);
			} else {
				// Display the dropdown menu if hidden
				dropdownMenu.style.display = 'block';
			}
		},

		// Asynchronous function to handle view selection
		onViewClick: async (viewId, viewName, columns) => {
			XRMWebTools.toggleOverlay(true);

			try {
				// Retrieve system users based on selected view
				const systemUsers = await XRMWebTools.WebApi.RetrieveWithCustomFilter(`systemusers?savedQuery=${viewId}`);

				// Map system users data to desired format
				const users = systemUsers.value.map(item => XRMWebTools.Panel2.mapDataToObject(item, columns));
				XRMWebTools.Panel2.columns = columns;
				XRMWebTools.Panel2.users = users;

				// Update UI with the retrieved data
				const dropdownMenu = document.getElementById('listofviews');
				dropdownMenu.style.display = 'none';

				document.getElementById("userDropdownMenuButton").innerHTML = viewName;
				XRMWebTools.Panel2.updateTableHeaders(columns);
				XRMWebTools.Panel2.updateUsers(users, columns);
			} catch (error) {
				console.error('Error processing view click:', error);
			} finally {
				XRMWebTools.toggleOverlay(false);
			}
		},

		// Function to map data to object format based on expected properties
		mapDataToObject: (data, expectedProperties) => {
			const result = {};

			for (const key in data) {
				if (data.hasOwnProperty(key)) {
					if (key === "") continue;

					const baseKey = key.split('@')[0];
					if (baseKey === "systemuserid") {
						result[baseKey] = data[key];
						continue;
					}

					if (expectedProperties.includes(baseKey)) {
						const formattedValueKey = `${baseKey}@OData.Community.Display.V1.FormattedValue`;
						result[baseKey] = data.hasOwnProperty(formattedValueKey) ? data[formattedValueKey] : data[key];
					}
				}
			}

			expectedProperties.forEach(prop => {
				if (!result.hasOwnProperty(prop)) {
					result[prop] = ' - ';
				}
			});

			return result;
		},

		// Function to update table headers
		updateTableHeaders: (headersArray) => {
			const theadElement = document.getElementById('panel2_columns');
			theadElement.innerHTML = ''; // Clear existing headers

			const row = document.createElement('tr');
			headersArray.forEach(header => {
				const th = document.createElement('th');
				th.setAttribute('scope', 'col'); // Set scope attribute for accessibility
				th.textContent = header;
				row.appendChild(th);
			});

			theadElement.appendChild(row);
		},

		// Function to update the table with user data
		updateUsers: (users, headersArray) => {
			const container = document.getElementById('ID_USERS_MAINLIST');
			container.innerHTML = '';

			users.forEach(user => {
				const row = document.createElement('tr');
				row.id = `ID_USER_${user.systemuserid}`;

				headersArray.forEach(header => {
					row.innerHTML += `<td>${user[header] || ''}</td>`;
				});

				container.appendChild(row);
			});

			document.getElementById("ID_Getting_Things_Ready").innerHTML = `Showing ${users.length} Users`;
		},

		// Asynchronous function to add last login information to users
		AddLastLogin: async () => {
			try {
				// Fetch last login information for each user
				const promises = XRMWebTools.Panel2.users.map(async (user) => {
					const userId = user["systemuserid"];
					if (userId) {
						const LastLoginRecords = await XRMWebTools.WebApi.RetrieveWithCustomFilter(`audits?$filter=_objectid_value eq '${userId}' and action eq 64&$orderby=createdon desc&$top=1`);
						if (LastLoginRecords.value && LastLoginRecords.value[0] && LastLoginRecords.value[0]["createdon@OData.Community.Display.V1.FormattedValue"]) {
							user["Last_Login"] = LastLoginRecords.value[0]["createdon@OData.Community.Display.V1.FormattedValue"];
							user["Last_Login_Date"] = LastLoginRecords.value[0]["createdon"];
						}
					}
				});

				await Promise.all(promises);
				XRMWebTools.Panel2.users.sort((a, b) => {
					const dateA = a["Last_Login_Date"] && a["Last_Login_Date"].trim() !== '-' ? new Date(a["Last_Login_Date"]) : null;
					const dateB = b["Last_Login_Date"] && b["Last_Login_Date"].trim() !== '-' ? new Date(b["Last_Login_Date"]) : null;

					if (dateA === null) return 1;
					if (dateB === null) return -1;

					return dateB - dateA; // Newest date first
				});

				// Update the UI with sorted user data
				XRMWebTools.Panel2.updateUsers(XRMWebTools.Panel2.users, XRMWebTools.Panel2.columns);

			} catch (e) {
				alert(e.message);
			}
		},
	},
	
	RegisterEvents: async function () {

		



		// Panel 2 - Load views
		document.getElementById("Load_views").addEventListener("click", async function (event) {
			// Prevent the default anchor behavior (e.g., scrolling to top)
			event.preventDefault();
			XRMWebTools.toggleOverlay(true, "Retrieving", "systemuser views");
			await XRMWebTools.Panel2.RetrieveSystemViews();
			XRMWebTools.toggleOverlay(false);
		});

		// Panel 2 - Add last login
		document.getElementById("addlastlogin").addEventListener("click", async function (event) {
			// Prevent the default anchor behavior (e.g., scrolling to top)
			event.preventDefault();
			XRMWebTools.toggleOverlay(true, "Retrieving", "Users Last Login");
			await XRMWebTools.Panel2.AddLastLogin();
			XRMWebTools.toggleOverlay(false);
		});


		await XRMWebTools.Panel2.RetrieveSystemViews();
	},
}

XRMWebTools.RegisterEvents();

