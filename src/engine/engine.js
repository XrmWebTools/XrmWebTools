
console.clear();
console.info("XWT: Hi!");
setTimeout(() => { document.getElementById("XrmWebTools").style.display = "block" }, 50);
document.getElementById("connect").innerHTML = `Connected to: ${window.location.origin}`;
// Add click event to open Google in a new tab
document.getElementById("connect").addEventListener("click", function () {
	window.open(`${window.location.origin}/main.aspx?forceUCI=1&pagetype=apps`, "_blank");
});

document.getElementById("url").innerHTML = `<i class="bi bi-house"></i> ${window.location.origin}`;

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
	Sidebar: {

		// Asynchronous function to retrieve and display online users
		getOnlineUsers: async () => {
			try {
				// Fetch audits from today with a specific filter
				const audits = await XRMWebTools.WebApi.RetrieveAllAuditsFromTodayWithCustomFilter(0, "action eq 64", "5000", false);

				const noapplicationusers = true;// document.getElementById("sidebar_onlineusers_noapplicationusers").checked;
				let applicationUsers = [];

				if (noapplicationusers) {
					// Fetch application users with a filter to exclude disabled users and include only those with an application ID
					const applicationUsersData = await XRMWebTools.WebApi.RetrieveWithCustomFilter(
						"systemusers?$filter=isdisabled ne true and applicationid ne null&$select=applicationid"
					);

					applicationUsers = applicationUsersData.value;
				}

				// Organize audits by user
				const userAudits = XRMWebTools.Sidebar.organizeAuditsByUser(audits);

				// Fetch user details based on organized audits and application users
				const userDetails = XRMWebTools.Sidebar.fetchUserDetails(userAudits, applicationUsers);

				// Display the online users in the sidebar
				XRMWebTools.Sidebar.displayOnlineUsers(userDetails);

				//document.getElementById("sidebar_onlineusers_info").classList.add("hidden");

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
				const auditsForUser = result[ID]; // All audits for this user
				let firstLogin = null;
				let lastLogin = null;

				// Find first and last login times by iterating over audits
				auditsForUser.forEach(audit => {
					const auditTime = new Date(audit.createdon);

					if (!firstLogin || auditTime < firstLogin) {
						firstLogin = auditTime;
					}

					if (!lastLogin || auditTime > lastLogin) {
						lastLogin = auditTime;
					}
				});

				let applicationUser = false;
				if (users) {
					// Check if the user is an application user
					const user = users.find(x => x["systemuserid"] === auditsForUser[0]["_objectid_value"]);
					applicationUser = user && user["applicationid"];
				}

				if (!applicationUser) {
					userDetails.push({
						ID,
						firstLogin: XRMWebTools.Sidebar.formatTime(firstLogin),
						lastLogin: XRMWebTools.Sidebar.formatTime(lastLogin),
						fullname: auditsForUser[0]["_objectid_value@OData.Community.Display.V1.FormattedValue"],
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
			let hours = date.getHours(); // Get hours in 24-hour format
			const minutes = date.getMinutes();

			const formattedHours = (hours < 10 ? '0' : '') + hours; // Pad single-digit hours with a leading 0
			const formattedMinutes = (minutes < 10 ? '0' : '') + minutes; // Pad single-digit minutes with a leading 0

			return `${formattedHours}:${formattedMinutes}`; // Return time in HH:MM format
		},

		// Function to display online users in the sidebar
		displayOnlineUsers: (userDetails) => {
			const userListElement = document.getElementById('ID_USERLIST');

			// Clear existing user list items that represent users
			const userItems = userListElement.querySelectorAll('li[id^="ID_USERLIST_"]');
			userItems.forEach(item => item.remove()); // Only remove user-related <li> elements

			// Append each user as a new list item
			userDetails.forEach(user => {
				const listItem = XRMWebTools.Sidebar.createUserListItem(user); // Create the list item as a DOM element
				userListElement.appendChild(listItem);
			});

			// Update the user count
			document.getElementById("onlineusercount").textContent = userDetails.length;
		},

		// Function to create a list item HTML for a user
		createUserListItem: (user) => {
			const initials = XRMWebTools.Sidebar.getInitials(user.fullname);

			// Check if firstLogin and lastLogin are the same
			const loginTime = user.firstLogin === user.lastLogin
				? user.firstLogin // If same, show only one time
				: `${user.firstLogin} - ${user.lastLogin}`; // If different, show the range

			// Create the list item element as a DOM node
			const listItem = document.createElement('li');
			listItem.id = `ID_USERLIST_${user.ID}`;
			listItem.innerHTML = `
        <a href="#" class="nav-link d-flex align-items-center">
            <div class="me-4">
                <div class="position-relative d-inline-block text-white">
                    <span class="avatar bg-soft-warning text-warning rounded-circle">${initials}</span>
                    <span class="position-absolute bottom-2 end-2 transform translate-x-1/2 translate-y-1/2 border-2 border-solid border-current w-3 h-3 bg-success rounded-circle"></span>
                </div>
            </div>
            <div>
                <span class="d-block text-sm font-semibold">${user.fullname}</span>
                <span class="d-block text-xs text-muted font-regular">${loginTime}</span>
            </div>
        </a>
    `;

			return listItem;
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
	ManageTabs: function () {
		// List of button and corresponding content section IDs
		const tabs = [
			{ buttonId: "id_start_page_link", contentId: "id_start_page" },

			{ buttonId: "id_audit_today_link", contentId: "id_audit_today" },
			{ buttonId: "id_users_last_login_link", contentId: "id_users_last_login" },
			{ buttonId: "id_advanced_audit_find_link", contentId: "id_advanced_audit_find" },
			{ buttonId: "id_plugintraces_link", contentId: "id_plugintraces" },
			{ buttonId: "id_solutions_link", contentId: "id_solutions" },
			{ buttonId: "id_auditcenter_link", contentId: "id_auditcenter" },
			//{ buttonId: "id_timeline2_link", contentId: "id_timeline2" },

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
	toggleOverlay: function (show, type = "", message = "") {
		const overlay = document.getElementById('overlay');
		//const messageElement = document.getElementById('app_info_message');

		if (show) {
			overlay.style.display = 'block';  // Show the overlay

		} else {
			overlay.style.display = 'none';  // Hide the overlay
		}
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
				const audits = await XRMWebTools.WebApi.RetrieveAllAuditsFromTodayWithCustomFilter(0, filter, top);
				console.log("audits today", audits);
				// Populate the table with the filtered audits
				XRMWebTools.Panel1.PopulateAuditsFromTodaysTable(audits);

				// Manage the notification balloons based on the audits fetched
				XRMWebTools.Panel1.ManageBalloons(audits);

				//document.getElementById("pane1_openinwebapi").removeAttribute("disabled");

			} catch (error) {
				// Handle any errors that occur during the process
				console.error("Error in ButtonClick_SearchAuditsFromToday:", error);
			}
		}
		,

		// Function to populate the table with audits from today
		PopulateAuditsFromTodaysTable: (audits, tableBodyId = "id_audits_from_today") => {

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
				const createdOnFormatted = data["createdon@OData.Community.Display.V1.FormattedValue"] || XRMWebTools.StringHelpers.formatDateString(data.createdon);
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
				const record_openincrm = `${window.location.origin}/main.aspx?pagetype=entityrecord&etn=${objectTypeCode}&id=${objectId}`;
				const user_openincrm = `${window.location.origin}/main.aspx?pagetype=entityrecord&etn=systemuser&id=${userId}`;
				const auditform_openinwebapi = `${window.location.origin}/api/data/v9.2/audits(${auditId})#p`;
				const changeDataJSON = XRMWebTools.StringHelpers.formatIfJson(data.changedata);
				// Create a new table row
				//const row = document.createElement('tr');
				//row.onclick = function () {
				//	document.getElementById('auditform_id').textContent = `Audit Details: ${auditId}`;
				//	document.getElementById('auditform_createdon').textContent = createdOnFormatted;
				//	document.getElementById('auditform_event').textContent = actionFormatted;
				//	document.getElementById('auditform_record').textContent = `${objectTypeCode} : ${objectIdFormatted}`;
				//	document.getElementById('auditform_recordid').textContent = objectId;
				//	document.getElementById('auditform_record_openincrm').setAttribute('href', record_openincrm);
				//	document.getElementById('auditform_user').textContent = userName;
				//	document.getElementById('auditform_userid').textContent = userId;
				//	document.getElementById('auditform_user_openincrm').setAttribute('href', user_openincrm);
				//	document.getElementById('auditform_changeddata').textContent = changeDataJSON;
				//	document.getElementById('auditform').style.display = 'block';
				//	document.getElementById('auditform_openinwebapi').setAttribute('href', auditform_openinwebapi);

				//	console.log("opened audit: ", data)

				//};

				// Create a new row element for the table
				const row = document.createElement('tr');

				// Set the default success status for badge formatting
				let success = "success";

				// Adjust the badge color based on the action type
				if (actionFormatted === 'Update') {
					success = "warning"; // Warning for update action
				}
				if (actionFormatted === 'Delete') {
					success = "danger"; // Danger for delete action
				}

				// Create the "Created On" cell with formatted date and a clickable link
				const createdOnCell = `<td><a class="text-heading font-semibold">${createdOnFormatted}</a></td>`;

				// Create the action cell, showing the action type (e.g., Create, Update, Delete) 
				// with the corresponding badge and background color (success, warning, danger)
				const actionCell = `
<td>
    <span class="badge badge-lg badge-dot">
        <i class="bg-${success}"></i>${actionFormatted}
    </span>
</td>`;

				// Function to handle the click event for the View button
				function handleViewClick() {
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
				}

				// Create the actions cell with "View" and "Delete" buttons
				const actions = `
<td>
    <a href="#" class="btn btn-sm btn-neutral" id="viewButton">View</a>
    <button type="button" class="btn btn-sm btn-square btn-neutral text-danger-hover" disabled>
        <i class="bi bi-trash"></i>
    </button>
</td>`;

				// Create the "Object Type Code" cell, hidden on smaller screens
				const objectTypeCodeCell = `<td class="d-none d-xl-table-cell">${objectTypeCodeFormatted}</td>`;

				// Create the "Changed Data" cell, with text truncated if it exceeds a certain width
				// Displays a tooltip with the full content on hover
				const changedDataCell = `
<td class="d-xl-table-cell" style="max-width: 1000px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${changedDataSanitized}">
    ${changedDataSanitized}
</td>`;

				// Create the "Record Type" cell
				const recordType = `<td>${recordTypeFormatted}</td>`;

				// Format the record name, underline it and make it clickable if it's not a placeholder ('-')
				const displayValue = objectIdFormattedSanitized;
				const recordName = `
<td class="d-xl-table-cell" ${displayValue !== '-' ? 'style="text-decoration: underline; cursor: pointer;"' : ''}>
    ${displayValue}
</td>`;

				// Create the "Changed By" cell, displaying the username
				// Special case: If the action was "User Access via Web," display the object instead of the username
				let changedBy = `<td>${userName}</td>`;
				if (actionFormatted === 'User Access via Web') {
					changedBy = `<td class="d-xl-table-cell">${displayValue}</td>`;
				}

				// Combine all the cells into the row's inner HTML
				row.innerHTML = createdOnCell + actionCell + actions + changedBy + recordType + recordName + changedDataCell;

				// Append the new row to the table body
				tableBody.appendChild(row);

				// Add an event listener to the "View" button
				const viewButton = row.querySelector('#viewButton');
				viewButton.addEventListener('click', (event) => {
					event.preventDefault(); // Prevent the default link behavior
					handleViewClick(); // Call the function to handle the click
				});

			});
		},

		// Function to manage balloon statistics based on the audits
		ManageBalloons: (audits) => {
			// Initialize counters for different actions
			let createsCount = 0;
			let updatesCount = 0;
			let deletesCount = 0;
			//let loginsCount = 0;
			let total = 0;

			// Categorize the audits
			audits.forEach(audit => {
				const operation = audit["action@OData.Community.Display.V1.FormattedValue"];
				switch (operation) {
					case "Create":
						createsCount++;
						total++;
						break;
					case "Update":
						updatesCount++;
						total++;
						break;
					case "Delete":
						deletesCount++;
						total++;
						break;
					//case "User Access via Web":
					//	loginsCount++;
					//	break;
					default:
						// Handle unexpected operation types if needed
						break;
				}
			});

			function updateProgressBar(progressBarID, count, total) {
				// Calculate the percentage based on count and total
				let percentage = (count / total) * 100;

				// Get the progress bar element by its ID
				let progressBar = document.getElementById(progressBarID);

				// Update the width style of the progress bar
				if (progressBar) {
					progressBar.style.width = percentage + '%';
				}
			}

			// Update the HTML elements with the counts
			document.getElementById('card_creates_today_account').textContent = `${createsCount}`;
			updateProgressBar('card_creates_today_account_progress', createsCount, total);



			document.getElementById('card_updates_today_account').textContent = `${updatesCount}`;
			updateProgressBar('card_updates_today_account_progress', updatesCount, total);


			document.getElementById('card_deletes_today_account').textContent = `${deletesCount}`;
			updateProgressBar('card_deletes_today_account_progress', deletesCount, total);

			//// Update badges to indicate loading status
			//const badgeElements = [
			//	'card_creates_today_badge',
			//	'card_updates_today_badge',
			//	'card_deletes_today_badge',
			////	'card_logins_today_badge'
			//];

			//badgeElements.forEach(elementId => {
			//	const badgeElement = document.getElementById(elementId);
			//	if (badgeElement) {
			//		badgeElement.textContent = 'Loaded';
			//		badgeElement.className = 'badge bg-success bg-opacity-25 text-success';
			//	}
			//});


		},
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
	Panel3: {
		AdvancedAudit: async () => {
			// Retrieve input values from the HTML form
			const table = document.getElementById("pane3_advancedaudit_table").value;
			const recordid = document.getElementById("pane3_advancedaudit_recordid").value;
			const userId = document.getElementById("pane3_advancedaudit_userid").value;
			let from = document.getElementById("pane3_advancedaudit_from").value;
			let until = document.getElementById("pane3_advancedaudit_until").value;
			let top = document.getElementById("pane3_advancedaudit_top").value;
			let event = document.getElementById("pane3_advancedaudit_event").value;

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
			if (recordid && !XRMWebTools.Panel3.ValidateRecordID(recordid)) {
				alert("Record ID is not valid (must be in GUID format: 00000000-0000-0000-0000-000000000000).");
				return;
			}

			// Validate the User ID if provided
			if (userId && !XRMWebTools.Panel3.ValidateRecordID(userId)) {
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

			if (event && event != "All") {
				filter += (filter != "$filter=" ? " and " : "") + `action eq ${event}`;
			}

			if (filter == "$filter=") {
				filter = `$orderby=createdon desc&$top=${top}`;
			} else {
				filter += `&$orderby=createdon desc&$top=${top}`;
			}
			try {

				// Make the API call to retrieve audits with the constructed filter
				const audits = await XRMWebTools.WebApi.RetrieveAllAuditsWithCustomFilter(filter);

				// Populate the UI with the retrieved audits
				XRMWebTools.Panel1.PopulateAuditsFromTodaysTable(audits, "id_audits_advanced_find");
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
	Panel5: {

		loadauditcenter: async () => {
			try {
				// Retrieve entity definitions with specific fields: LogicalName and IsAuditEnabled
				const entityDef = await XRMWebTools.WebApi.RetrieveWithCustomFilter(
					`EntityDefinitions?$select=LogicalName,IsAuditEnabled,ObjectTypeCode`
				);
				const allEntities = entityDef.value;
				console.log("panel 5 allEntities", allEntities);

				//// Sort entities: first by audited entities (IsAuditEnabled = true), then the rest
				//allEntities.sort((a, b) => (b.IsAuditEnabled.Value === true) - (a.IsAuditEnabled.Value === true));

				// Filter entities by ensuring they have a valid entityTypeCode
				const auditedEntities = allEntities.filter(entity => entity.IsAuditEnabled.Value === true);

				// Display the filtered and sorted entities in the panel
				XRMWebTools.Panel5.displayEntities(auditedEntities);

				document.getElementById("pane5_loadauditcenter").innerHTML = "Refresh Audit Center";
			} catch (e) {
				// Handle any errors that occur during the process
				alert("Error: " + e.message);
			}
		},

		displayEntities: (entities) => {

			const container = document.getElementById('entities-container');
			container.innerHTML = ''; // Clear any existing content
			entities.forEach(entity => {
				const entity_MetadataId = entity.MetadataId;
				const auditEnabled = entity.IsAuditEnabled.Value === true;
				const successORdANGER = auditEnabled ? "success" : "danger";
				const text = auditEnabled ? "Audit ON" : "Audit OFF";

				const tempDiv = document.createElement('div');
				tempDiv.className = "d-flex align-items-center"
				tempDiv.innerHTML = `
                        <i class="bi bi-database me-2 text-muted"></i>
                        <a href="#" class="text-sm text-heading text-primary-hover">${entity.LogicalName}</a>
						<a class="text-sm text-heading text-primary-hover"></a>
						<span class="badge bg-${successORdANGER}-subtle text-${successORdANGER}" style="margin-left:5px">${text}</span>
                        <div class="ms-auto text-end">

                            <a href="#" class="btn btn-sm px-3 py-1 btn-neutral text-muted">Load Fields</a>

                        </div>
                `;

				// Get the "Load Attributes" button
				const loadAttributesButton = tempDiv.querySelector('a.btn-neutral');

				// Attach a click event listener
				loadAttributesButton.addEventListener('click', async (event) => {
					event.preventDefault(); // Prevent the default link behavior

					XRMWebTools.Panel5.displayEntityAttributes(entity.LogicalName, entity_MetadataId)
					//alert(); // Show an alert with the entity name
				});


				container.appendChild(tempDiv);
			});
		},


		displayEntityAttributes: async (entityname, entity_MetadataId) => {

			XRMWebTools.toggleOverlay(true, "Retrieving", "Attributes for " + entityname);
			const entityDefentityname = await XRMWebTools.WebApi.RetrieveWithCustomFilter(`EntityDefinitions(LogicalName='${entityname}')/Attributes`);
			console.log("panel 5 attributes", entityDefentityname.value)
			XRMWebTools.Panel5.displayAttributes(entityDefentityname.value, entity_MetadataId);

			document.getElementById("allfieldsfor").innerHTML = `All fields for ${entityname}`;
			XRMWebTools.toggleOverlay(false);

		},

		displayAttributes: (attributes, entity_MetadataId) => {
			//// Sort attributes so that those with IsAuditEnabled.Value === true come first
			attributes.sort((a, b) => {
				const auditA = a.IsAuditEnabled?.Value ? 1 : 0;
				const auditB = b.IsAuditEnabled?.Value ? 1 : 0;
				return auditB - auditA; // Sort in descending order
			});

			const container = document.getElementById('container_attr');
			// Clear the container's current content
			while (container.firstChild) {
				container.removeChild(container.firstChild);
			}

			
			attributes.forEach(attr => {

				const attr_MetadataId = attr.MetadataId;
					const logicalName = attr.LogicalName || '';
					const auditEnabled = attr.IsAuditEnabled?.Value === true;
					const text = auditEnabled ? "Audit ON" : "Audit OFF";
					const successORdANGER = auditEnabled ? "success" : "danger";

				const tempDiv = document.createElement('div');
				tempDiv.className = "d-flex align-items-center"
				tempDiv.innerHTML = `
                        <i class="bi bi-database me-2 text-muted"></i>
                        <a href="#" class="text-sm text-heading text-primary-hover">${logicalName}</a>
						<a class="text-sm text-heading text-primary-hover"></a>
						<span class="badge bg-${successORdANGER}-subtle text-${successORdANGER}" style="margin-left:5px">${text}</span>
                        <div class="ms-auto text-end">

                            <a href="#" class="btn btn-sm px-3 py-1 btn-neutral text-muted">Customize</a>

                        </div>
                `;

				//// Get the "Load Attributes" button
				const loadAttributesButton = tempDiv.querySelector('a.btn-neutral');

				// Attach a click event listener
				loadAttributesButton.addEventListener('click', async (event) => {
					event.preventDefault(); // Prevent the default link behavior

					XRMWebTools.CONFIG.openAttribute(attr_MetadataId, entity_MetadataId)
					//alert("jojo"); // Show an alert with the entity name
				});


				container.appendChild(tempDiv);
			});
			//const container = document.getElementById('container_attr');

			//// Clear the container's current content
			//while (container.firstChild) {
			//	container.removeChild(container.firstChild);
			//}

			//// Sort attributes so that those with IsAuditEnabled.Value === true come first
			//attributes.sort((a, b) => {
			//	const auditA = a.IsAuditEnabled?.Value ? 1 : 0;
			//	const auditB = b.IsAuditEnabled?.Value ? 1 : 0;
			//	return auditB - auditA; // Sort in descending order
			//});

			//attributes.forEach(attr => {
			//	const attr_MetadataId = attr.MetadataId;
			//	const logicalName = attr.LogicalName || '';
			//	const auditEnabled = attr.IsAuditEnabled?.Value === true;
			//	const text = auditEnabled ? "Audit ON" : "Audit OFF";
			//	const successORdANGER = auditEnabled ? "success" : "danger";

			//	// Create the outer div for each attribute
			//	const attributeDiv = document.createElement('div');

			//	// Create the inner HTML structure as a string
			//	const htmlContent = `
   //         <div class="row align-items-center">
   //             <div class="col-md-2">
   //                 <label class="form-label">LogicalName</label>
   //             </div>
   //             <div class="col-md-10 col-xl-10">
   //                 <div>
   //                     <input type="text" class="form-control" value="${logicalName}" disabled>
   //                 </div>
   //             </div>
   //         </div>
   //         <div class="row align-items-center mt-2">
   //             <div class="col-md-2">
   //                 <label class="form-label"></label>
   //             </div>
   //             <div class="col-md-10 col-xl-10">
   //                 <span class="badge text-bg-primary edit-attribute">Edit attribute</span>
   //                 <span class="badge bg-${successORdANGER}-subtle text-${successORdANGER}">${text}</span>
   //             </div>
   //         </div>
   //         <hr class="my-3">
   //     `;

			//	// Set the innerHTML of the div
			//	attributeDiv.innerHTML = htmlContent;

			//	// Append the div to the container
			//	container.appendChild(attributeDiv);

			//	// Add event listener to "Edit attribute" badge
			//	const editBadge = attributeDiv.querySelector('.edit-attribute');
			//	editBadge.addEventListener('click', () => {
			//		XRMWebTools.CONFIG.openAttribute(attr_MetadataId, entity_MetadataId);

			//	});
			//});
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
                        <span class="d-block text-muted text-xs"># Dynamics 365 MHC Service</span>
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
	RegisterEvents: function () {

		console.log("XWT: RegisterEvents");

		// Panel 1
		document.getElementById("id_pane1_searchauditsfromtoday").addEventListener("click", async function (event) {
			// Prevent the default anchor behavior (e.g., scrolling to top)
			event.preventDefault();
			XRMWebTools.toggleOverlay(true, "Retrieving", "Audits from today");
			await XRMWebTools.Panel1.ButtonClick_SearchAuditsFromToday();
			XRMWebTools.toggleOverlay(false);
		});

		//// Sidebar
		document.getElementById('XRMWT_LoadOnlineUsers').addEventListener('click',

			async (event) => {
				event.preventDefault();
				XRMWebTools.toggleOverlay(true, "Retrieving", "Online Users");
				await XRMWebTools.Sidebar.getOnlineUsers();
				XRMWebTools.toggleOverlay(false);
			}
		);

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


		// Panel 3 - Advanced audit
		document.getElementById("pane3_advancedaudit").addEventListener("click", async function (event) {

			// Prevent the default anchor behavior (e.g., scrolling to top)
			event.preventDefault();

			// Show overlay and perform the advanced audit logic
			XRMWebTools.toggleOverlay(true, "Retrieving", "Advanced Audit");

			// Wait for the advanced audit to complete
			await XRMWebTools.Panel3.AdvancedAudit();

			// Hide the overlay after the audit is done
			XRMWebTools.toggleOverlay(false);
		});


		//document.getElementById("auditengine_opened").addEventListener("click", async function (event) {
		//	// Prevent the default anchor behavior (e.g., scrolling to top)
		//	event.preventDefault();
		//	console.log("auditengine: Opening recieved");
		//	try {
		//		if (Xrm && Xrm.Page && Xrm.Page.data && Xrm.Page.data.entity) {
		//			console.log("auditengine: Opening recieved while on an entity form");
		//			XRMWebTools.UI.clearAdvancedFindParams();
		//			const entityName = Xrm.Page.data.entity.getEntityName();
		//			const entityId = Xrm.Page.data.entity.getId().replace(/[{}]/g, "").toLowerCase();
		//			XRMWebTools.UI.setAdvancedFindWithFormEntity(entityName, entityId);
		//		}
		//	} catch (e) {
		//		console.log("auditengine: opened error")
		//	}
		//});



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

		document.getElementById("pane5_loadauditcenter").addEventListener("click", async function (event) {
			// Prevent the default anchor behavior (e.g., scrolling to top)
			event.preventDefault();
			XRMWebTools.toggleOverlay(true, "Retrieving", "Entity Definitions");
			await XRMWebTools.Panel5.loadauditcenter();
			XRMWebTools.toggleOverlay(false);
		});

		document.getElementById("pane6_solutions").addEventListener("click", async function (event) {
			// Prevent the default anchor behavior (e.g., scrolling to top)
			event.preventDefault();
			XRMWebTools.toggleOverlay(true, "Retrieving", "Solutions");
			await XRMWebTools.Panel6.loadsolutions();
			XRMWebTools.toggleOverlay(false);
		});





	}
}

XRMWebTools.ManageTabs();
XRMWebTools.RegisterEvents();

if (window.location.href.endsWith("/today")) {
	document.getElementById("id_audit_today_link").click();
	document.getElementById("id_pane1_searchauditsfromtoday").click();
}

if (window.location.href.endsWith("/plugins")) {
	document.getElementById("id_plugintraces_link").click();
	document.getElementById("pane4_plugintraces").click();
}

if (window.location.href.endsWith("/solutions")) {
	document.getElementById("id_solutions_link").click();
	document.getElementById("pane6_solutions").click();
}

if (window.location.href.endsWith("/users")) {
	document.getElementById("id_users_last_login_link").click();
	document.getElementById("Load_views").click();
}


if (window.location.href.endsWith("/auditcenter")) {
	document.getElementById("id_auditcenter_link").click();
}