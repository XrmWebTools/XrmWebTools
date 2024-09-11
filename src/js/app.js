$(function () {
	var AuditApp = {
		ApplicationType: {
			DynamicsCRM: "Dynamics CRM",
			Dynamics365: "Dynamics 365"
		},
		Constants: {
			SlideTime: 250,
			NotificationClassPrefix: "audit-history-",
			NotificationTimer: null
		},
		UI: {
			setTitleColor: function () {
				const topBar = window.top.document.getElementById('topBar');
				if (topBar) {
					const topBar_color = window.getComputedStyle(topBar).backgroundColor;
					document.getElementById("app_time").style.color = topBar_color;
					//document.getElementById("id_audit_today_link").style.color = topBar_color;
					//document.getElementById("id_users_last_login_link").style.color = topBar_color;
					//document.getElementById("id_advanced_audit_find_link").style.color = topBar_color;
					//document.getElementById("id_pane1_searchauditsfromtoday").style.backgroundColor = topBar_color;
					////document.getElementById("id_pane1_searchauditsfromtoday").style.borderColor = topBar_color;
					//document.getElementById("app_loadonlineusers").style.backgroundColor = topBar_color;
					//document.getElementById("sidebar_onlineusers_noapplicationusers").style.backgroundColor = topBar_color;
				}
			},
			setDateTimes: function () {
				var today = new Date().toISOString().split('T')[0];
				document.getElementById('pane3_advancedaudit_until').value = today;
				document.getElementById('pane3_advancedaudit_from').value = today;
			},
			clearAdvancedFindParams: function () {
				document.getElementById('pane3_advancedaudit_table').value = null;
				document.getElementById('pane3_advancedaudit_recordid').value = null;
				document.getElementById('pane3_advancedaudit_userid').value = null;
				document.getElementById('pane3_advancedaudit_until').value = null;
				document.getElementById('pane3_advancedaudit_from').value = null;
			},
			setAdvancedFindWithFormEntity: function (entityName, entityId) {
				if (!entityName || !entityId) { return; }
				entityId = entityId.replace(/[{}]/g, "").toLowerCase();
				document.getElementById("pane3_advancedaudit_table").value = entityName;
				document.getElementById("pane3_advancedaudit_recordid").value = entityId;
				document.getElementById("id_advanced_audit_find_link").click();
				document.getElementById("pane3_advancedaudit").click();
			}
		},
		CONFIG: {
			baseUrl: 'https://github.com/auditengine/',
			getUrl_naam: () => {
				return `${AuditApp.CONFIG.baseUrl}auditengine/issues`;
			}
		},
		WebApi: {
			// Method to retrieve data with a custom filter
			RetrieveWithCustomFilter: async function (urlEnding) {
				const clientURL = Xrm.Page.context.getClientUrl();
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
				var clientURL = Xrm.Page.context.getClientUrl();
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
					req.open("POST", Xrm.Page.context.getClientUrl() + "/api/data/v9.2/" + customActionName, true);
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
				const clientUrl = Xrm.Page.context.getClientUrl();
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
				const clientUrl = Xrm.Page.context.getClientUrl();
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
			}
		},
		TargetFrame: {
			GetApplicationType: function () {
				var mainBody = document.querySelectorAll('body[scroll=no]');
				var topBar = document.querySelector("div[data-id=topBar]")

				if (mainBody && mainBody.length > 0) {
					return AuditApp.ApplicationType.DynamicsCRM
				} else if (topBar) {
					return AuditApp.ApplicationType.Dynamics365
				} else {
					return null;
				}
			},
			GetContent: function () {
				try {
					var applicationType = AuditApp.TargetFrame.GetApplicationType()
					if (applicationType == AuditApp.ApplicationType.DynamicsCRM) {
						return $("iframe").filter(function () {
							return $(this).css("visibility") == "visible"
						})[0].contentWindow;
					} else if (applicationType == AuditApp.ApplicationType.Dynamics365) {
						return window;
					} else {
						return null;
					}
				} catch (e) {
					AuditApp.Errors.ExecutionError(e);
				}
			},
			GetXrm: function () {
				try {
					return this.GetContent().Xrm;
				} catch (e) {
					AuditApp.Errors.ExecutionError(e);
				}
			}
		},
		Errors: {
			ExecutionError: function () {
				alert("Error");
			}
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
			const messageElement = document.getElementById('app_info_message');

			if (show) {
				overlay.style.display = 'block';  // Show the overlay

				if (message && type) {
					messageElement.innerHTML = `<strong>${type}:</strong> ${message}`;
					messageElement.style.display = 'block';  // Show the message element
				} else {
					messageElement.style.display = 'none';  // Hide the message element if no message/type
				}
			} else {
				overlay.style.display = 'none';  // Hide the overlay
				messageElement.style.display = 'none';  // Hide the message element
			}
		},
		ManageTabs: function () {
			// List of button and corresponding content section IDs
			const tabs = [
				{ buttonId: "id_audit_today_link", contentId: "id_audit_today" },
				{ buttonId: "id_users_last_login_link", contentId: "id_users_last_login" },
				{ buttonId: "id_advanced_audit_find_link", contentId: "id_advanced_audit_find" },
				{ buttonId: "id_plugintraces_link", contentId: "id_plugintraces" },

			];

			// Function to handle tab switching
			function handleTabClick(event, selectedTab) {
				event.preventDefault();

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
		},
		startTime: function () {
			console.log("auditengine: startTime");

			function checkTime(i) {
				if (i < 10) { i = "0" + i };  // add zero in front of numbers < 10
				return i;
			}

			function updateTime() {
				const today = new Date();
				let h = today.getHours();
				let m = today.getMinutes();
				let s = today.getSeconds();
				m = checkTime(m);
				s = checkTime(s);
				document.getElementById('app_time').innerHTML = h + ":" + m + ":" + s;
				setTimeout(updateTime, 1000);
			}

			function setUserName() {

				if (typeof Xrm !== 'undefined') {
					var userSettings = Xrm.Utility.getGlobalContext().userSettings;
					var currentuserid = userSettings.userId;
					var username = userSettings.userName;

					document.getElementById('app_user_fullname').innerHTML = username;
					document.getElementById('app_user_initialen').innerHTML = getInitials(username);

				} else {
					document.getElementById('app_user_fullname').innerHTML = "Test User";
					document.getElementById('app_user_initialen').innerHTML = "TU";
				}
			}

			function getInitials(fullname) {

				// Split the name by spaces and filter out empty parts (e.g., from extra spaces)
				const nameParts = fullname.split(' ').filter(Boolean);

				if (nameParts.length === 0) {
					return '';
				}

				// Get the first letter of the first name
				const firstInitial = nameParts[0].charAt(0).toUpperCase();

				// Get the first letter of the last name if there's more than one part
				const secondInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0).toUpperCase() : '';

				// Return the initials: either one or two letters
				return firstInitial + secondInitial;
			}

			function userpanel() {
				// Get the dropdown button and the dropdown menu
				var dropdownButton = document.getElementById('opensystemdropdown');
				var dropdownMenu = document.getElementById('systemdropdown');

				// Add click event listener to the button
				dropdownButton.addEventListener('click', function () {
					// Toggle the visibility of the dropdown menu
					if (dropdownMenu.style.display === 'block') {
						dropdownMenu.style.display = 'none';
					} else {
						dropdownMenu.style.display = 'block';
					}
				});

				// Optional: Close the dropdown if the user clicks outside of it
				document.addEventListener('click', function (event) {
					if (!dropdownButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
						dropdownMenu.style.display = 'none';
					}
				});
			}

			updateTime();
			setTimeout(setUserName, 2000);
			userpanel();

		},
		RegisterEvents: function () {

			console.log("auditengine: RegisterEvents");

			// Panel 1
			document.getElementById("id_pane1_searchauditsfromtoday").addEventListener("click", async function () {
				AuditApp.toggleOverlay(true, "Retrieving", "Audits from today");
				await AuditApp.Panel1.ButtonClick_SearchAuditsFromToday();
				AuditApp.toggleOverlay(false);
			});

			// Sidebar
			document.getElementById("app_loadonlineusers").addEventListener("click", async function () {
				AuditApp.toggleOverlay(true, "Retrieving", "Online Users");
				await AuditApp.Sidebar.getOnlineUsers();
				AuditApp.toggleOverlay(false);
			});

			// Panel 2 - Load views
			document.getElementById("Load_views").addEventListener("click", async function () {
				AuditApp.toggleOverlay(true, "Retrieving", "systemuser views");
				await AuditApp.Panel2.RetrieveSystemViews();
				AuditApp.toggleOverlay(false);
			});

			// Panel 2 - Add last login
			document.getElementById("addlastlogin").addEventListener("click", async function () {
				AuditApp.toggleOverlay(true, "Retrieving", "Users Last Login");
				await AuditApp.Panel2.AddLastLogin();
				AuditApp.toggleOverlay(false);
			});


			// Panel 3 - Advanced audit
			document.getElementById("pane3_advancedaudit").addEventListener("click", async function () {
				AuditApp.toggleOverlay(true, "Retrieving", "Advanced Audit");
				await AuditApp.Panel3.AdvancedAudit();
				AuditApp.toggleOverlay(false);
			});

			document.getElementById("auditengine_opened").addEventListener("click", async function () {
				console.log("auditengine: Opening recieved");
				try {
					if (Xrm && Xrm.Page && Xrm.Page.data && Xrm.Page.data.entity) {
						console.log("auditengine: Opening recieved while on an entity form");
						AuditApp.UI.clearAdvancedFindParams();
						const entityName = Xrm.Page.data.entity.getEntityName();
						const entityId = Xrm.Page.data.entity.getId().replace(/[{}]/g, "").toLowerCase();
						AuditApp.UI.setAdvancedFindWithFormEntity(entityName, entityId);
					}
				} catch (e) {
					console.log("auditengine: opened error")
				}
			});



			document.getElementById("pane4_plugintraces").addEventListener("click", async function () {
				AuditApp.toggleOverlay(true, "Retrieving", "Plugin Traces");
				await AuditApp.Panel4.PluginTraces();
				AuditApp.toggleOverlay(false);
			});
		},
		Panel1: {

			// Asynchronous function to handle the click event for searching audits from today
			ButtonClick_SearchAuditsFromToday: async () => {
				try {
					// Initialize variables
					let top = "";  // This will hold the value of the top count input if checked
					let filter = "action ne 64";  // Default filter value to exclude action web access

					// Check if the "top count" checkbox is checked
					const topcountbool = document.getElementById("topcountcheckbox").checked;
					if (topcountbool) {
						// If checked, get the value from the input field
						const topInputValue = document.getElementById("topcountinput").value;

						// Convert the value to an integer and validate if it's a number greater than 0
						const topValue = parseInt(topInputValue, 10); // Base 10

						if (!isNaN(topValue) && topValue > 0) {
							top = topValue;  // Assign valid value to the 'top' variable
						} else {
							// Handle invalid input, e.g., notify the user or set a default value
							alert("Invalid input: Top count must be a number greater than 0.");
							return;
						}
					}


					// Check if the "show web access" option is checked
					const showWebAccess = document.getElementById("today_showwebaccess").checked;
					if (showWebAccess) {
						// If checked, clear the filter to show all actions including web access
						filter = "";
					}

					// Fetch audits from today with a custom filter
					const audits = await AuditApp.WebApi.RetrieveAllAuditsFromTodayWithCustomFilter(0, filter, top);
					console.log("audits today", audits);
					// Populate the table with the filtered audits
					AuditApp.Panel1.PopulateAuditsFromTodaysTable(audits);

					// Manage the notification balloons based on the audits fetched
					AuditApp.Panel1.ManageBalloons(audits);

					//document.getElementById("pane1_openinwebapi").removeAttribute("disabled");

				} catch (error) {
					// Handle any errors that occur during the process
					console.error("Error in ButtonClick_SearchAuditsFromToday:", error);
				}
			}
			,

			// Function to populate the table with audits from today
			PopulateAuditsFromTodaysTable: (audits, tableBodyId = "id_audits_from_today") => {

				const appplyButton = tableBodyId == "id_audits_from_today";
				const tableBody = document.getElementById(tableBodyId);

				// Clear existing rows in the table
				tableBody.innerHTML = '';

				// Iterate over each audit and create table rows
				audits.forEach(data => {


					const entityMap = {
						'&': '&amp;',
						'<': '&lt;',
						'>': '&gt;',
						'"': '&quot;',
						"'": '&#39;',
						'/': '&#x2F;',
						'': '&#x60;',
						'=': '&#x3D;'
					};

					function escapeHtml(string) {
						return String(string).replace(/[&<>"'=/]/g, function (s) {
							return entityMap[s];
						});
					}

					const auditId = data["auditid"];
					const createdOnFormatted = data["createdon@OData.Community.Display.V1.FormattedValue"] || AuditApp.StringHelpers.formatDateString(data.createdon);
					const objectId = data["_objectid_value"];
					const objectIdFormatted = data["_objectid_value@OData.Community.Display.V1.FormattedValue"] || objectId;
					const objectIdFormattedSanitized = escapeHtml(objectIdFormatted);
					const userId = data["_userid_value"];
					const userName = data["_userid_value@OData.Community.Display.V1.FormattedValue"] || '-';
					const actionFormatted = data["action@OData.Community.Display.V1.FormattedValue"] || data.action;
					const objectTypeCode = data.objecttypecode;
					const objectTypeCodeFormatted = data["objecttypecode@OData.Community.Display.V1.FormattedValue"] || objectTypeCode;
					const recordTypeFormatted = data["objecttypecode@OData.Community.Display.V1.FormattedValue"] || '-';
					const menu = '<td class="text-end"><a href="#" class="btn btn-xxs btn-neutral">...</a></td>';
					const changedData = data.changedata;
					const changedDataSanitized = escapeHtml(changedData);
					const record_openincrm = `${Xrm.Page.context.getClientUrl()}/main.aspx?pagetype=entityrecord&etn=${objectTypeCode}&id=${objectId}`;
					const user_openincrm = `${Xrm.Page.context.getClientUrl()}/main.aspx?pagetype=entityrecord&etn=systemuser&id=${userId}`;
					const auditform_openinwebapi = `${Xrm.Page.context.getClientUrl()}/api/data/v9.2/audits(${auditId})#p`;
					const changeDataJSON = AuditApp.StringHelpers.formatIfJson(data.changedata);
					// Create a new table row
					const row = document.createElement('tr');
					row.onclick = function () {
						document.getElementById('auditform_id').textContent = `Audit Details: ${auditId}`;
						document.getElementById('auditform_createdon').textContent = createdOnFormatted;
						document.getElementById('auditform_event').textContent = actionFormatted;
						document.getElementById('auditform_record').textContent = `${objectTypeCode} : ${objectIdFormatted}`;
						document.getElementById('auditform_recordid').textContent = objectId;
						document.getElementById('auditform_record_openincrm').setAttribute('href', record_openincrm);
						document.getElementById('auditform_user').textContent = userName;
						document.getElementById('auditform_userid').textContent = userId;
						document.getElementById('auditform_user_openincrm').setAttribute('href', user_openincrm);
						document.getElementById('auditform_changeddata').textContent = changeDataJSON;
						document.getElementById('auditform').style.display = 'block';
						document.getElementById('auditform_openinwebapi').setAttribute('href', auditform_openinwebapi);

						console.log("opened audit: ", data)

					};
					// Create each cell with proper formatting
					const createdOnCell = `<td>${createdOnFormatted}</td>`;
					const actionCell = `<td class="${actionFormatted === 'Delete' ? 'text-danger' :
						actionFormatted === 'Create' ? 'text-success' :
							actionFormatted === 'User Access via Web' ? 'text-primary' :
								actionFormatted === 'Update' ? 'text-warning' : ''
						} d-none d-xl-table-cell">${actionFormatted}</td>`;
					const objectTypeCodeCell = `<td class="d-none d-xl-table-cell">${objectTypeCodeFormatted}</td>`;
					const changedDataCell = `<td class="text-xs">${changedDataSanitized}</td>`;
					const recordType = `<td>${recordTypeFormatted}</td>`;
					const displayValue = objectIdFormattedSanitized;
					const recordName = `<td class="d-none d-xl-table-cell" ${displayValue !== '-' ? `style="text-decoration: underline; cursor: pointer;"` : ''}>${displayValue}</td>`;
					let changedBy = `<td class="d-none d-xl-table-cell">${userName}</td>`;
					if (actionFormatted === 'User Access via Web') { changedBy = `<td class="d-none d-xl-table-cell">${displayValue}</td>`; }

					if (appplyButton) {
						row.innerHTML = menu + createdOnCell + actionCell + changedBy + recordType + recordName + changedDataCell;
					} else {
						row.innerHTML = createdOnCell + actionCell + changedBy + recordType + recordName + changedDataCell;
					}
					// Combine all cells into a single row and append it to the table body
					tableBody.appendChild(row);
				});
			},

			// Function to manage balloon statistics based on the audits
			ManageBalloons: (audits) => {
				// Initialize counters for different actions
				let createsCount = 0;
				let updatesCount = 0;
				let deletesCount = 0;
				let loginsCount = 0;

				// Categorize the audits
				audits.forEach(audit => {
					const operation = audit["action@OData.Community.Display.V1.FormattedValue"];
					switch (operation) {
						case "Create":
							createsCount++;
							break;
						case "Update":
							updatesCount++;
							break;
						case "Delete":
							deletesCount++;
							break;
						case "User Access via Web":
							loginsCount++;
							break;
						default:
							// Handle unexpected operation types if needed
							break;
					}
				});

				// Update the HTML elements with the counts
				document.getElementById('card_creates_today_account').textContent = `Count: ${createsCount}`;
				document.getElementById('card_updates_today_account').textContent = `Count: ${updatesCount}`;
				document.getElementById('card_deletes_today_account').textContent = `Count: ${deletesCount}`;
				document.getElementById('card_logins_today_count').textContent = `Count: ${loginsCount}`;

				// Update badges to indicate loading status
				const badgeElements = [
					'card_creates_today_badge',
					'card_updates_today_badge',
					'card_deletes_today_badge',
					'card_logins_today_badge'
				];

				badgeElements.forEach(elementId => {
					const badgeElement = document.getElementById(elementId);
					if (badgeElement) {
						badgeElement.textContent = 'Loaded';
						badgeElement.className = 'badge bg-success bg-opacity-25 text-success';
					}
				});
			},
		},
		Sidebar: {

			// Asynchronous function to retrieve and display online users
			getOnlineUsers: async () => {
				try {
					// Fetch audits from today with a specific filter
					const audits = await AuditApp.WebApi.RetrieveAllAuditsFromTodayWithCustomFilter(0, "action eq 64", "", false);

					const noapplicationusers = document.getElementById("sidebar_onlineusers_noapplicationusers").checked;
					let applicationUsers = [];

					if (noapplicationusers) {
						// Fetch application users with a filter to exclude disabled users and include only those with an application ID
						const applicationUsersData = await AuditApp.WebApi.RetrieveWithCustomFilter(
							"systemusers?$filter=isdisabled ne true and applicationid ne null&$select=applicationid"
						);

						applicationUsers = applicationUsersData.value;
					}

					// Organize audits by user
					const userAudits = AuditApp.Sidebar.organizeAuditsByUser(audits);

					// Fetch user details based on organized audits and application users
					const userDetails = AuditApp.Sidebar.fetchUserDetails(userAudits, applicationUsers);

					// Display the online users in the sidebar
					AuditApp.Sidebar.displayOnlineUsers(userDetails);

					document.getElementById("sidebar_onlineusers_info").classList.add("hidden");

				} catch (error) {
					console.error("Error retrieving online users:", error);
				}
			},

			// Function to organize audits by user ID
			organizeAuditsByUser: (audits) => {
				const result = {};
				const allIDs = [];

				// Group audits by user ID
				audits.forEach(audit => {
					const objectId = audit._objectid_value;
					if (!result[objectId]) {
						result[objectId] = [];
						allIDs.push(objectId);
					}
					result[objectId].push(audit);
				});

				return { result, allIDs };
			},

			// Function to fetch user details from the audits and users list
			fetchUserDetails: ({ result, allIDs }, users) => {
				const userDetails = [];

				// Iterate over all user IDs and fetch details
				for (const ID of allIDs) {
					const audit = result[ID][0]; // Assuming there is at least one audit per user
					const timestamp = AuditApp.Sidebar.formatTime(audit.createdon);

					let applicationUser = false;
					if (users) {
						// Check if the user is an application user
						const user = users.find(x => x["systemuserid"] === audit["_objectid_value"]);
						applicationUser = user && user["applicationid"];
					}


					if (!applicationUser) {
						userDetails.push({
							ID,
							timestamp,
							fullname: audit["_objectid_value@OData.Community.Display.V1.FormattedValue"],
							firstname: "",
							lastname: ""
						});
					}
				}

				return userDetails;
			},

			// Function to format a date string into a time string (HH:MM AM/PM)
			formatTime: (dateString) => {
				const date = new Date(dateString);
				let hours = date.getHours();
				const minutes = date.getMinutes();
				const period = hours >= 12 ? 'PM' : 'AM';

				// Convert hours to 12-hour format
				if (hours > 12) hours -= 12;
				if (hours === 0) hours = 12;

				const formattedHours = (hours < 10 ? '0' : '') + hours;
				const formattedMinutes = (minutes < 10 ? '0' : '') + minutes;

				return `${formattedHours}:${formattedMinutes} ${period}`;
			},

			// Function to display online users in the sidebar
			displayOnlineUsers: (userDetails) => {
				const userListElement = document.getElementById('ID_USERLIST');
				userListElement.innerHTML = `
            <li>
                <div class="nav-link text-xs font-semibold text-uppercase text-muted ls-wide">
                    Users Online Today:
                    <span class="badge bg-soft-primary text-primary rounded-pill d-inline-flex align-items-center ms-4">0</span>
                </div>
            </li>
        `;

				// Add each user to the list
				userDetails.forEach(user => {
					userListElement.innerHTML += AuditApp.Sidebar.createUserListItem(user);
				});

				// Update the badge with the number of users
				const userCountBadge = userListElement.querySelector('.badge');
				userCountBadge.textContent = userDetails.length;
			},

			// Function to create a list item HTML for a user
			createUserListItem: (user) => {
				const initials = AuditApp.Sidebar.getInitials(user.fullname);

				return `
            <li id="ID_USERLIST_${user.ID}">
                <a href="#" class="nav-link d-flex align-items-center">
                    <div class='me-4'>
                        <div class='position-relative d-inline-block text-white'>
                            <span class='avatar bg-soft-warning text-warning rounded-circle'>${initials}</span>
                            <span class='position-absolute bottom-2 end-2 transform translate-x-1/2 translate-y-1/2 border-2 border-solid border-current w-3 h-3 bg-success rounded-circle'></span>
                        </div>
                    </div>
                    <div>
                        <span class="d-block text-sm font-semibold">${user.fullname}</span>
                        <span class="d-block text-xs text-muted font-regular">${user.timestamp}</span>
                    </div>
                </a>
            </li>
        `;
			},

			// Function to get initials from a fullname
			getInitials: (fullname) => {
				// Split the name by spaces and filter out empty parts
				const nameParts = fullname.split(' ').filter(Boolean);

				if (nameParts.length === 0) {
					return '';
				}

				// Get the first letter of the first name and last name
				const firstInitial = nameParts[0].charAt(0).toUpperCase();
				const secondInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0).toUpperCase() : '';

				// Return the initials
				return firstInitial + secondInitial;
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
					const views = await AuditApp.WebApi.RetrieveWithCustomFilter("savedqueries?$filter=returnedtypecode eq 'systemuser'");

					// Extract relevant details from views
					const names = views.value.map(view => ({
						name: view.name,
						savedqueryid: view.savedqueryid,
						layoutjson: extractColumnHeaders(view.layoutjson)
					}));

					// Append views to the dropdown menu
					await AuditApp.Panel2.appendViewsToDropdown(names);
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
						await AuditApp.Panel2.onViewClick(view.savedqueryid, view.name, view.layoutjson);
					});

					// Append anchor to dropdown menu
					dropdownMenu.appendChild(viewLink);
				});

				// Optionally trigger a view click for a specific view
				const enabled = views.filter(v => v.name === "Enabled Users");
				if (enabled.length > 0) {
					await AuditApp.Panel2.onViewClick(enabled[0].savedqueryid, enabled[0].name, enabled[0].layoutjson);
				} else {
					// Display the dropdown menu if hidden
					dropdownMenu.style.display = 'block';
				}
			},

			// Asynchronous function to handle view selection
			onViewClick: async (viewId, viewName, columns) => {
				AuditApp.toggleOverlay(true);

				try {
					// Retrieve system users based on selected view
					const systemUsers = await AuditApp.WebApi.RetrieveWithCustomFilter(`systemusers?savedQuery=${viewId}`);

					// Map system users data to desired format
					const users = systemUsers.value.map(item => AuditApp.Panel2.mapDataToObject(item, columns));
					AuditApp.Panel2.columns = columns;
					AuditApp.Panel2.users = users;

					// Update UI with the retrieved data
					const dropdownMenu = document.getElementById('listofviews');
					dropdownMenu.style.display = 'none';

					document.getElementById("userDropdownMenuButton").innerHTML = viewName;
					AuditApp.Panel2.updateTableHeaders(columns);
					AuditApp.Panel2.updateUsers(users, columns);
				} catch (error) {
					console.error('Error processing view click:', error);
				} finally {
					AuditApp.toggleOverlay(false);
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
					const promises = AuditApp.Panel2.users.map(async (user) => {
						const userId = user["systemuserid"];
						if (userId) {
							const LastLoginRecords = await AuditApp.WebApi.RetrieveWithCustomFilter(`audits?$filter=_objectid_value eq '${userId}' and action eq 64&$orderby=createdon desc&$top=1`);
							if (LastLoginRecords.value && LastLoginRecords.value[0] && LastLoginRecords.value[0]["createdon@OData.Community.Display.V1.FormattedValue"]) {
								user["Last_Login"] = LastLoginRecords.value[0]["createdon@OData.Community.Display.V1.FormattedValue"];
								user["Last_Login_Date"] = LastLoginRecords.value[0]["createdon"];
							}
						}
					});

					await Promise.all(promises);
					AuditApp.Panel2.users.sort((a, b) => {
						const dateA = a["Last_Login_Date"] && a["Last_Login_Date"].trim() !== '-' ? new Date(a["Last_Login_Date"]) : null;
						const dateB = b["Last_Login_Date"] && b["Last_Login_Date"].trim() !== '-' ? new Date(b["Last_Login_Date"]) : null;

						if (dateA === null) return 1;
						if (dateB === null) return -1;

						return dateB - dateA; // Newest date first
					});

					// Update the UI with sorted user data
					AuditApp.Panel2.updateUsers(AuditApp.Panel2.users, AuditApp.Panel2.columns);

				} catch (e) {
					alert(e.message);
				}
			},
		},
		Panel3: {
			AdvancedAudit: async () => {
				// Retrieve input values from the HTML form
				const table = document.getElementById("pane3_advancedaudit_table").value;
				const recordid = document.getElementById("pane3_advancedaudit_recordid").value;
				const userId = document.getElementById("pane3_advancedaudit_userid").value;
				let from = document.getElementById("pane3_advancedaudit_from").value;
				let until = document.getElementById("pane3_advancedaudit_until").value;
				let top = document.getElementById("pane3_advancedaudit_top").value;
				if (!top) {
					top = 5000;
					document.getElementById("pane3_advancedaudit_top").value = 5000;

				}

				// Format 'from' date if provided
				if (from) {
					const fromDate = new Date(from);
					fromDate.setHours(0, 0, 0, 0); // Set time to the start of the day
					from = `createdon gt ${fromDate.toISOString()}`; // Format as ISO date
				}

				// Format 'until' date if provided
				if (until) {
					const untilDate = new Date(until);
					untilDate.setHours(23, 59, 59, 999); // Set time to the end of the day
					until = `createdon le ${untilDate.toISOString()}`; // Format as ISO date
				}

				// Validate the Record ID if provided
				if (recordid && !AuditApp.Panel3.ValidateRecordID(recordid)) {
					alert("Record ID is not valid (must be in GUID format: 00000000-0000-0000-0000-000000000000).");
					return;
				}

				// Validate the User ID if provided
				if (userId && !AuditApp.Panel3.ValidateRecordID(userId)) {
					alert("User ID is not valid (must be in GUID format: 00000000-0000-0000-0000-000000000000).");
					return;
				}

				// Build the filter query
				let filter = "$filter=";

				// Add table filter if 'table' is provided
				if (table) {
					filter += `objecttypecode eq '${table}'`;
				}
				// Add record ID filter if 'recordid' is provided
				if (recordid) {
					filter += (filter != "$filter=" ? " and " : "") + `_objectid_value eq '${recordid}'`;
				}

				// Add user ID filter if 'userId' is provided
				if (userId) {
					filter += (filter != "$filter=" ? " and " : "") + `_userid_value eq '${userId}'`;
				}

				// Add 'from' date filter if 'from' is provided
				if (from) {
					filter += (filter != "$filter=" ? " and " : "") + from;
				}

				// Add 'until' date filter if 'until' is provided
				if (until) {
					filter += (filter != "$filter=" ? " and " : "") + until;
				}

				if (filter == "$filter=") {
					filter = `$orderby=createdon desc&$top=${top}`;
				} else {
					filter += `&$orderby=createdon desc&$top=${top}`;
				}
				try {

					// Make the API call to retrieve audits with the constructed filter
					const audits = await AuditApp.WebApi.RetrieveAllAuditsWithCustomFilter(filter);

					// Populate the UI with the retrieved audits
					AuditApp.Panel1.PopulateAuditsFromTodaysTable(audits, "id_audits_advanced_find");
				} catch (e) {
					// Clear the audits table in case of an error
					document.getElementById("id_audits_advanced_find").innerHTML = '';

					// Display an error message for the table entity not being found
					alert(e.message);
				}

			}

			,

			ValidateRecordID: (recordID) => {
				// Remove all dashes and convert to lowercase
				let cleanedID = recordID.replace(/-/g, '').toLowerCase();

				// Check if the cleaned ID is 32 characters long
				if (cleanedID.length === 32) {
					return true;
					// Optionally, you can return it in the original format or without dashes
					// Return it with dashes in the UUID format
					//return cleanedID.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
				} else {
					return false;
				}
			}


		},
		Panel4: {
			PluginTraces: async () => {

				const top = 5000;
				let filter = "$filter=";

				let from = document.getElementById("plugintracelog_from").value;
				const plugintracelog_message_create = document.getElementById("plugintracelog_message_create").checked;
				const plugintracelog_message_update = document.getElementById("plugintracelog_message_update").checked;
				const plugintracelog_message_associate = document.getElementById("plugintracelog_message_associate").checked;
				let plugintracelog_entity = document.getElementById("plugintracelog_entity").value;
				const plugintracelog_message_exceptiononly = document.getElementById("plugintracelog_message_exceptiononly").checked;
				if (plugintracelog_message_exceptiononly) {
					filter += (filter != "$filter=" ? " and " : "") + "exceptiondetails ne null";
				}
				if (plugintracelog_entity) {
					filter += (filter != "$filter=" ? " and " : "") + `primaryentity eq '${plugintracelog_entity}'`;
				}		
				if (plugintracelog_message_create) {
					filter += (filter != "$filter=" ? " and " : "") + "messagename eq 'Create'";
				}
				if (plugintracelog_message_update) {
					filter += (filter != "$filter=" ? " and " : "") + "messagename eq 'Update'";
				}
				if (plugintracelog_message_associate) {
					filter += (filter != "$filter=" ? " and " : "") + "messagename eq 'Associate'";
				}
				if (from) {
					const fromDate = new Date(from);
					fromDate.setHours(0, 0, 0, 0); // Set time to the start of the day
					from = `createdon gt ${fromDate.toISOString()}`; // Format as ISO date
				}
				if (from) {
					filter += (filter != "$filter=" ? " and " : "") + from;
				}

				if (filter == "$filter=") {
					filter = ``;
				} else {
					filter += `&`;
				}
				try {

					const plugintraces = await AuditApp.WebApi.RetrieveWithCustomFilter(
						`plugintracelogs?${filter}$top=5000&$orderby=performanceconstructorstarttime desc`
					);
					console.log("plugintraces", plugintraces);
					AuditApp.Panel4.renderPluginLogs(plugintraces.value)
				} catch (e) {

					alert(e.message);
				}

			},
			renderPluginLogs: (data) => {

				function formatDate(dateString) {
					if (!dateString) return 'N/A';
					const date = new Date(dateString);
					return date.toLocaleString();
				}

				function shortenString(input) {
					if (input.length > 62) {
						return input.slice(0, 62) + '...';
					}
					return input;
				}

				function extractUsefulInfo(errorMessage) {
					// Regular expression to match the message after 'Message:' and capture until the next period or closing parenthesis
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


					const startdatetime = formatDate(item.performanceconstructorstarttime);
					const duration = item.performanceexecutionduration || '';
					const operation = item["operationtype@OData.Community.Display.V1.FormattedValue"] || 'N/A';
					let typename = item.typename || '';
					typename = shortenString(typename);
					const messagename = item.messagename || '';
					const depth = item.depth || '';
					const mode = item["mode@OData.Community.Display.V1.FormattedValue"] || 'N/A';
					let exception = item.exceptiondetails || '';
					exception = extractUsefulInfo(exception);

					row.innerHTML = `
            <td>${startdatetime}</td>
            <td>${duration}</td>
            <td class="d-none d-xl-table-cell">${operation}</td >
            <td class="d-none d-xl-table-cell">${typename}</td>
            <td>${messagename}</td>
            <td>${depth}</td>
            <td>${mode}</td>
			<td>${item.primaryentity}</td>
            <td>${exception}</td>
        `;

					mainList.appendChild(row);
				});

				countElement.textContent = data.length ? `${data.length} plugin logs retrieved.` : '0 plugin logs found';

			}
		}
	};

	AuditApp.RegisterEvents();
	AuditApp.startTime();
	AuditApp.ManageTabs();
	AuditApp.UI.setTitleColor();
	AuditApp.UI.setDateTimes();
});