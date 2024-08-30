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
		},
		CONFIG: {
			baseUrl: '',
			getUrl_naam: () => {

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

			// Method to retrieve data for a specific entity
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
			RetrieveAllAuditsFromTodayWithCustomFilter: async function (hour = 3, filter = "") {
				const clientUrl = Xrm.Page.context.getClientUrl();
				const startOfToday = new Date();
				startOfToday.setHours(hour, 0, 0, 0); // Set time to 3:00 AM today
				const filterDate = startOfToday.toISOString();

				if (filter) {
					filter = ` and ${filter}`;
				}

				let nextLink = `${clientUrl}/api/data/v9.1/audits?$filter=createdon gt ${filterDate}${filter}&$orderby=createdon desc`;
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
		RegisterjQueryExtensions: function () {
			$.fn.bindFirst = function (name, fn) {
				this.on(name, fn);
				this.each(function () {
					var handlers = $._data(this, 'events')[name.split('.')[0]];
					var handler = handlers.pop();
					handlers.splice(0, 0, handler);
				});
			};
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
		SayHi: function () {
			alert("HI")
		},
		toggleOverlay: function (show, message = "", type = "") {
			const overlay = document.getElementById('overlay');
			const messageElement = document.getElementById('app_info_message');

			if (show) {
				overlay.classList.remove('hidden');

				if (message && type) {
					messageElement.innerHTML = `<strong>${type}:</strong> ${message}`;
					messageElement.classList.remove('hidden');
				}
			} else if (overlay && messageElement) {
				overlay.classList.add('hidden');
				messageElement.classList.add('hidden');
			}
		},
		ManageTabs: function () {
			// List of button and corresponding content section IDs
			const tabs = [
				{ buttonId: "id_audit_today_link", contentId: "id_audit_today" },
				{ buttonId: "id_advanced_audit_find_link", contentId: "id_advanced_audit_find" },
				{ buttonId: "id_users_last_login_link", contentId: "id_users_last_login" },
				{ buttonId: "id_user_form_link", contentId: "id_user_form" },
				{ buttonId: "id_audit_form_link", contentId: "id_audit_form" },
				//{ buttonId: "id_playground_link", contentId: "id_playground" },

				//


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
			setUserName();
			userpanel();

		},
		RegisterEvents: function () {


			//panel 1
			document.getElementById("id_pane1_searchauditsfromtoday").addEventListener("click", async function () {

				AuditApp.toggleOverlay(true);
				await AuditApp.Panel1.ButtonClick_SearchAuditsFromToday();
				AuditApp.toggleOverlay(false);


			});


			// Sidebar
			document.getElementById("app_loadonlineusers").addEventListener("click", async function () {

				AuditApp.toggleOverlay(true);
				await AuditApp.Sidebar.getOnlineUsers();
				AuditApp.toggleOverlay(false);
				app_loadonlineusers.classList.add("hidden");
			});
		},
		Panel1: {

			ButtonClick_SearchAuditsFromToday: async () => {

				try {
					const audits = await AuditApp.WebApi.RetrieveAllAuditsFromTodayWithCustomFilter(0);
					AuditApp.Panel1.PopulateAuditsFromTodaysTable(audits);
					AuditApp.Panel1.ManageBalloons(audits);

				} catch (error) {
					console.error("Error ButtonClick_SearchAuditsFromToday:", error);
				}
			},

			PopulateAuditsFromTodaysTable: (audits) => {
				const tableBody = document.getElementById('id_audits_from_today');

				// Clear existing rows
				tableBody.innerHTML = '';

				audits.forEach(data => {
					const createdOnFormatted = data["createdon@OData.Community.Display.V1.FormattedValue"] || AuditApp.Panel1.formatDateString(data.createdon);
					const objectIdFormatted = data["_objectid_value@OData.Community.Display.V1.FormattedValue"] || data["_objectid_value"];
					const userIdFormatted = data["_userid_value@OData.Community.Display.V1.FormattedValue"] || data["_userid_value"];
					const actionFormatted = data["action@OData.Community.Display.V1.FormattedValue"] || data.action;
					const objectTypeCodeFormatted = data["objecttypecode@OData.Community.Display.V1.FormattedValue"] || data.objecttypecode;

					// Create a new table row
					const row = document.createElement('tr');

					// Create each cell
					const createdOnCell = `<td>${createdOnFormatted}</td>`;
					const objectIdCell = `<td class="d-none d-xl-table-cell">${objectIdFormatted}</td>`;
					const userIdCell = `<td class="d-none d-xl-table-cell">${userIdFormatted}</td>`;
					const actionCell = `<td class="${actionFormatted === 'Delete' ? 'text-danger' :
						actionFormatted === 'Create' ? 'text-success' :
							actionFormatted === 'User Access via Web' ? 'text-primary' :

								actionFormatted === 'Update' ? 'text-warning' : ''
						} d-none d-xl-table-cell">${actionFormatted}</td>`;


					const objectTypeCodeCell = `<td class="d-none d-xl-table-cell">${objectTypeCodeFormatted}</td>`;
					const changedDataCell = `<td class="text-xs">${data.changedata}</td>`;
					const auditIdCell = `<td class="d-none d-xl-table-cell">${data.auditid || '-'}</td>`;
					const recordType = `<td>${data["objecttypecode@OData.Community.Display.V1.FormattedValue"] || '-'}</td>`;


					const displayValue = data["_objectid_value@OData.Community.Display.V1.FormattedValue"] || '-';
					const recordName = `<td class="d-none d-xl-table-cell" ${displayValue !== '-' ? `style="color: blue; text-decoration: underline; cursor: pointer;" onclick="alert('Coming soon...')"` : ''
						}>${displayValue}</td>`;


					const errorMessageCell = `<td class="d-none d-xl-table-cell">${data.auditid || '-'}</td>`;
					let changedBy = `<td class="d-none d-xl-table-cell">${data["_userid_value@OData.Community.Display.V1.FormattedValue"] || '-'}</td>`;


					if (actionFormatted === 'User Access via Web') {
						changedBy = `<td class="d-none d-xl-table-cell">${displayValue}</td>`;
						;
					}
					// Combine all cells into a single row
					row.innerHTML = createdOnCell + actionCell + changedBy + recordType + recordName + changedDataCell;

					// Append the row to the table body
					tableBody.appendChild(row);
				});
			},

			formatDateString: (dateString) => {
				// Parse the input string into a Date object
				const date = new Date(dateString);

				// Get the month name in short format
				const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
					"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
				const month = monthNames[date.getMonth()];

				// Get the day of the month
				const day = date.getDate();

				// Get the time portion from the original string
				const time = dateString.split('T')[1].split('Z')[0];

				// Construct the desired output string
				return `${month} ${day}, ${time}`;
			},

			ManageBalloons: (audits) => {
				// Initialize counters for different actions
				let createsCount = 1;
				let updatesCount = 0;
				let deletesCount = 0;
				let loginsCount = 0;
				// Iterate through the audits to categorize them
				audits.forEach(audit => {

					const entityName = audit["objecttypecode@OData.Community.Display.V1.FormattedValue"];// Example: 'Account'

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
				document.getElementById('card_logins_today_count').textContent = `Unique Count: ${loginsCount}`;

				// Update badges to "Loaded" and change their class to success theme
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
			}
		},
		Sidebar: {

			getOnlineUsers: async () => {

				try {
					const audits = await AuditApp.WebApi.RetrieveAllAuditsFromTodayWithCustomFilter(0, "action eq 64");


					const userAudits = AuditApp.Sidebar.organizeAuditsByUser(audits);
					const userDetails = AuditApp.Sidebar.fetchUserDetails(userAudits);

					AuditApp.Sidebar.displayOnlineUsers(userDetails);
				} catch (error) {
					console.error("Error retrieving online users:", error);
				}
			},

			organizeAuditsByUser: (audits) => {
				const result = {};
				const allIDs = [];

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
			fetchUserDetails: ({ result, allIDs }) => {
				const userDetails = [];
				for (const ID of allIDs) {
					const audit = result[ID][0];
					const timestamp = AuditApp.Sidebar.formatTime(audit.createdon);



					if (true) {
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
			formatTime: (dateString) => {
				const date = new Date(dateString);
				let hours = date.getHours();
				const minutes = date.getMinutes();
				const period = hours >= 12 ? 'PM' : 'AM';
				if (hours > 12) hours -= 12;
				if (hours === 0) hours = 12;

				const formattedHours = (hours < 10 ? '0' : '') + hours;
				const formattedMinutes = (minutes < 10 ? '0' : '') + minutes;

				return `${formattedHours}:${formattedMinutes} ${period}`;
			},
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

				userDetails.forEach(user => {
					userListElement.innerHTML += AuditApp.Sidebar.createUserListItem(user);
				});

				const userCountBadge = userListElement.querySelector('.badge');
				userCountBadge.textContent = userDetails.length;
			},
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

			getInitials: (fullname) => {

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


		},
	};

	AuditApp.RegisterjQueryExtensions();
	AuditApp.RegisterEvents();
	AuditApp.startTime();
	AuditApp.ManageTabs();



});


