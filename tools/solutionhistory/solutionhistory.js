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
	
	
	Panel6: {
		loadsolutions: async () => {
			try {
				// Retrieve solutions from the API
				const solutions = await XRMWebTools.WebApi.RetrieveWithCustomFilter('solutions?$filter=isvisible eq true&$select=friendlyname,uniquename,_publisherid_value');

				const publisherWithSolutions = [];  // Array to store publishers and their solutions
				const publisherAttribute = "_publisherid_value@OData.Community.Display.V1.FormattedValue";  // Publisher attribute key

				// Filter out publishers that match unwanted strings
				const filteredPublishers = solutions.value
					.map(solution => solution[publisherAttribute])
					.filter(publisher => ![
						"Dynamics 365",
						"MicrosoftCorporation",
						"Microsoft First Party",
						"Dynamics Marketing",
						"Microsoft Dynamics GDPR",
						"Microsoft",
						"Default Publisher",
						"Consent solution extensions publisher",
						"PowerCat"
					].some(unwanted => publisher.includes(unwanted)));

				// Build publisherWithSolutions array
				filteredPublishers.forEach(publisher => {
					// Check if publisher is already added to the result
					if (!publisherWithSolutions.some(entry => entry.publisher === publisher)) {
						// Filter the solutions for the current publisher
						const customPublisherSolutions = solutions.value.filter(
							solution => solution[publisherAttribute] === publisher
						);
						// Push the publisher and its solutions into the result array
						publisherWithSolutions.push({ publisher, solutions: customPublisherSolutions });
					}
				});

				// Sort publishers by the number of solutions (descending order)
				publisherWithSolutions.sort((a, b) => b.solutions.length - a.solutions.length);

				// Output the result to the console
				console.log("auditengine: publisherWithSolutions", publisherWithSolutions);
				const rendersolutions = solutions.value.sort((a, b) => {
					let nameA = a.friendlyname.toLowerCase(); // Convert to lowercase for case-insensitive comparison
					let nameB = b.friendlyname.toLowerCase();

					if (nameA < nameB) return -1; // a comes before b
					if (nameA > nameB) return 1;  // b comes before a
					return 0; // names are equal
				});

				console.log("auditengine: solutions", rendersolutions);
				XRMWebTools.Panel6.rendersolutions(rendersolutions);

				XRMWebTools.Panel6.loadedsolutions = rendersolutions;

				const searchInput = document.getElementById('filtersolutions');
				searchInput.addEventListener('input', (e) => {
					const query = e.target.value;
					XRMWebTools.Panel6.filterSolutions(query);
				});

			} catch (error) {
				// Handle any errors that occur during the process
				alert("Error: " + error.message);
			}
		},

		rendersolutions: (solutions) => {
			const paneSolutionsList = document.getElementById('pane_solutions_list');

			// Clear the pane before rendering
			paneSolutionsList.innerHTML = '';

			solutions.forEach(solution => {
				// Create a new div for each solution
				const solutionItem = document.createElement('div');
				solutionItem.className = 'list-group-item d-flex align-items-center';

				// Set the HTML structure for each solution item
				solutionItem.innerHTML = `
            <div class="me-4">
                <!-- You can add an icon or image here if needed -->
            </div>
            <div class="flex-fill">
                <a href="#" class="d-block h6 font-semibold mb-1">${solution.friendlyname}</a>
                <span class="d-block text-sm text-muted">${solution["_publisherid_value@OData.Community.Display.V1.FormattedValue"]}</span>
							   <span class="badge bg-primary text-white load-history-btn">Load Solution Imports</span>

            </div>
        `;

				// Append the solution item to the list
				paneSolutionsList.appendChild(solutionItem);

				// Add a click event listener to the Load History button
				const loadHistoryBtn = solutionItem.querySelector('.load-history-btn');
				loadHistoryBtn.addEventListener('click', async () => {
					XRMWebTools.toggleOverlay(true, "Retrieving", "Solution History for " + solution.friendlyname);

					await XRMWebTools.Panel6.solutionHistory(solution.uniquename, solution.friendlyname);
					XRMWebTools.toggleOverlay(false);

				});
			});
		},

		loadedsolutions: [],

		filterSolutions: (query) => {

			if (!query) {
				XRMWebTools.Panel6.rendersolutions(XRMWebTools.Panel6.loadedsolutions);

			}


			// Convert query to lowercase for case-insensitive search
			const filteredSolutions = XRMWebTools.Panel6.loadedsolutions.filter(solution =>
				solution.friendlyname.toLowerCase().includes(query.toLowerCase())
				||
				solution.uniquename.toLowerCase().includes(query.toLowerCase())
				||
				solution["_publisherid_value@OData.Community.Display.V1.FormattedValue"].toLowerCase().includes(query.toLowerCase())

			);

			// Render filtered solutions
			XRMWebTools.Panel6.rendersolutions(filteredSolutions);

		},

		solutionHistory: async (uniquename, FriendlyName) => {

			const hist = await XRMWebTools.WebApi.RetrieveWithCustomFilter(`msdyn_solutionhistories?$filter=msdyn_name eq '${uniquename}' and msdyn_operation eq 0&$select=msdyn_starttime,msdyn_operation,msdyn_status&$orderby=msdyn_starttime desc`);
			console.log("audit engine hist", hist);

			const container = document.getElementById('solutionswithhistorylist');
			container.innerHTML = "";


			// Loop through the array and create rows for each item
			hist.value.forEach(item => {

				const tempDiv = XRMWebTools.Panel6.generateHtml(item);
				// Close the list group and card body
				container.appendChild(tempDiv);
			});



			//// Append the new card to the container
			//container.appendChild(card);

		},

		generateHtml: (data) => {
			// Format the start date in the desired format: "02-okt-2024 02:36"
			const date = new Date(data.msdyn_starttime);
			const formattedDate = date.toLocaleString('nl-NL', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			}).replace('.', '');
			let temp = "";
			if (data.msdyn_exceptionmessage) {
				temp = `<span class="badge bg-danger text-white" style="max-width: 200px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${data.msdyn_exceptionmessage}</span>`;
			}
			// Determine if managed
			const isManaged = data.msdyn_ismanaged ? "Managed" : "Unmanaged";

			// Calculate progress (assuming 100% if status is 1)
			const progress = data.msdyn_status === 1 ? 100 : 0;

			const success_or_danger = data.msdyn_exceptionmessage ? "danger" : "success";
			// Generate the HTML structure
			const html = `
        <div class="d-flex bg-body-secondary gap-3 rounded-3 p-4">
            <div class="vstack gap-2">
                <div class="d-flex mb-1">
                    <div class="">
                        <span class="d-block text-heading text-sm fw-semibold">${data.msdyn_name}</span>
                        <span class="d-block text-muted text-xs">Service</span>
                        <span class="d-block text-muted text-xs">${data.msdyn_publishername}</span>
                        <div class="ms-auto d-block text-heading text-sm fw-semibold">${formattedDate}</div>
                        <span class="d-block text-muted text-xs">${isManaged}</span>
                        <span class="d-block text-muted text-xs">${progress}</span>
                    </div>
                </div>
                <div class="progress bg-body-tertiary">
                    <div class="progress-bar bg-${success_or_danger}" role="progressbar" aria-label="Basic example" style="width:${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <span class="badge bg-primary text-white load-imports-btn">Load Solution Imports</span>
				${temp}
            </div>
        </div>
    `;

			// Create a temporary DOM element to insert the HTML
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = html;

			// Add event listener to the button
			const button = tempDiv.querySelector('.load-imports-btn');
			button.addEventListener('click', async () => {

				alert("Work In Progess.")

				return;
				console.log("XWT: generatehtml data", data);

				//api/data/v9.2/importjobs?$filter=solutionname%20eq%20%27NextRelease%27%20and%20name%20eq%20%27Customizations%27and%20createdon%20gt%202024-09-30T22:00:00.000Z&$orderby=startedon%20desc#plusplus


				const importjobs = await XRMWebTools.WebApi.RetrieveWithCustomFilter(`importjobs?$filter=solutionname eq '${data.msdyn_name}' and name eq 'Customizations'&$orderby=startedon desc`);
				console.log("XWT: generatehtml importjobs all", importjobs.value);
				alert(importjobs.value[0].importjobid);


				//const aaaa = await XRMWebTools.WebApi.ExecuteGlobalAction(`importjobs()`)
				//const xmlString = importjobs.value[0].data;
				//console.log("auditengine generatehtml importjobs", importjobs.value[0].data);

				//let parser = new DOMParser();
				//let xmlDoc = parser.parseFromString(xmlString, "text/xml");

				//// Convert XML attributes to a simple JSON object
				//let jsonResult = {};
				//let attributes = xmlDoc.documentElement.attributes;

				//for (let i = 0; i < attributes.length; i++) {
				//	jsonResult[attributes[i].name] = attributes[i].value;
				//}
				//console.log("auditengine generatehtml importjobs jsonResult", jsonResult);

				// Output the result
				//console.log(jsonResult);
				//importjobs?$filter=solutionname%20eq%20%27NextRelease%27&$orderby=startedon%20desc#p

				// alert(data.msdyn_name);  // Show alert with the msdyn_name
			});

			return tempDiv;  // Return the actual DOM element, not innerHTML
		}


	},

	RegisterEvents: async function () {

		document.getElementById("pane6_solutions").addEventListener("click", async function (event) {
			// Prevent the default anchor behavior (e.g., scrolling to top)
			event.preventDefault();
			XRMWebTools.toggleOverlay(true, "Retrieving", "Solutions");
			await XRMWebTools.Panel6.loadsolutions();
			XRMWebTools.toggleOverlay(false);
		});		
	},
}
XRMWebTools.RegisterEvents();