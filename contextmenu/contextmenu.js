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
const show_custom_context_menu = false;
const hide_default_context_menu = false;
try {
	$(function () {
		const ctx = {

			FORM: function () {
				
				$("#contextmenu_godmode").click(function (e) {
					e.preventDefault(); // Prevent the default action
					try {
						// Get the currently expanded tab
						const selectedTab = Xrm.Page.ui.tabs.get((x) => x.getDisplayState() === 'expanded')[0];

						// Set all attributes to not required
						Xrm.Page.data.entity.attributes.forEach((a) => a.setRequiredLevel('none'));

						// Enable all controls on the page
						Xrm.Page.ui.controls.forEach((c) => {
							c.setVisible(true); // Make control visible
							if (c.setDisabled) { c.setDisabled(false); } // Enable control if possible
							if (c.clearNotification) { c.clearNotification(); } // Clear notifications if applicable
						});

						// Show and expand all tabs and sections
						Xrm.Page.ui.tabs.forEach((t) => {
							t.setVisible(true); // Make tab visible
							t.setDisplayState('expanded'); // Expand tab
							t.sections.forEach((s) => s.setVisible(true)); // Make all sections visible
						});

						// Set focus on the selected tab if possible
						if (selectedTab.setFocus) {
							selectedTab.setDisplayState('expanded'); // Ensure tab is expanded
							selectedTab.setFocus(); // Set focus on the tab
						}

						document.getElementById("contextmenu_logicalnames").click();
					} catch (e) {
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });
					}

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}
				});

				$("#contextmenu_logicalnames").click(function (e) {
					e.preventDefault(); // Prevent the default action

					try {
						var updateStatus; // Variable to track update status
						// Iterate through all controls on the page
						Xrm.Page.ui.controls.forEach(function (a) {
							try {
								if (a && a.setLabel && a.getName) { // Ensure control is valid
									if (!a._$originalLabel) { // Check if original label is set
										a._$originalLabel = a.getLabel(); // Store original label
										var newLabel = `${a.getLabel()} (${a.getName()})`; // Create new label
										a.setLabel(newLabel); // Set the new label
										updateStatus = "update"; // Mark status as updated
									}
								}
							} catch (e) { }
						});
						updateStatus = null; // Reset update status
					} catch (e) {
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });
					}
					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}
				});
				
				$("#contextmenu_recordid").click(function () {
					try {
						alert(Xrm.Page.data.entity.getId());
					} catch (e) {
						// Show a warning if an error occurs (e.g., not on the expected page)
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });
					}

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}
				});

				$("#contextmenu_webapi").click(function () {
					try {
						var apiVersion = Xrm.Utility.getGlobalContext().getVersion();
						var shortVersion = apiVersion.substring(3, apiVersion.indexOf(".") - 1);

						Xrm.Utility.getEntityMetadata(Xrm.Page.data.entity.getEntityName(), "")
							.then(function (result) {
								var url = Xrm.Page.context.getClientUrl() + "/api/data/v" + shortVersion + "/" + result.EntitySetName + "(" + Xrm.Page.data.entity.getId() + ")";
								url = url.replace("{", "").replace("}", "");
								window.open(url + "#p", '_blank');
							});

					} catch (e) {
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });
					}

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}
				});


				$("#contextmenu_changedfields").click(function () {

					try {

						Xrm.Page.ui.controls.forEach(function (control) {
							var attr = (control && control.getAttribute) ? control.getAttribute() : undefined;
							if (attr && attr.getIsDirty && attr.getIsDirty()) {
								var name = control.getName();
								ctx.FormHelpers.getAttributeContainer(name).css('background', '#8957ff');
							}
						});


					} catch (e) {
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });
					}

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}

				});

				$("#contextmenu_refreshform").click(function () {
					try {
						Xrm.Page.data.refresh();
					} catch (e) {
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });
					}

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}
				});

				$("#contextmenu_refresh_autosaveoff").click(function () {

					try {
						Xrm.Page.data.refresh(false).then(
							() => {
								Xrm.Page.data.entity.addOnSave((econtext) => {
									let eventArgs = econtext.getEventArgs();
									if (eventArgs.getSaveMode() === 70 || eventArgs.getSaveMode() === 2) {
										eventArgs.preventDefault();
									}
								});
								alert("Form refreshed without save. Autosave turned off.");

							},
							(error) => {
								alert(error.message);
							}
						);
					} catch (e) {
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });
					}

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}


				});

				$("#contextmenu_metadata").click(function () {
					try {
						var apiVersion = Xrm.Utility.getGlobalContext().getVersion();
						var shortVersion = apiVersion.substring(3, apiVersion.indexOf(".") - 1);
						Xrm.Utility.getEntityMetadata(Xrm.Page.data.entity.getEntityName(), "")
							.then(function (result) {
								var url = Xrm.Page.context.getClientUrl() + "/api/flow/v1.0/$metadata.json/entities/" + result.EntitySetName;
								//url = url.replace("{", "").replace("}", "");
								window.open(url, '_blank');
							});

					} catch (e) {
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });
					}

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}


				});

				$("#contextmenu_oldformeditor").click(function () {

					try {
						var params = [Xrm.Page.context.getClientUrl() + "/main.aspx"];
						params.push("?pagetype=formeditor");
						params.push("&appSolutionId={FD140AAF-4DF4-11DD-BD17-0019B9312238}");
						params.push("&etn=" + Xrm.Page.data.entity.getEntityName().toLowerCase());
						params.push("&extraqs=formtype=main");
						params.push("&formId=" + Xrm.Page.ui.formSelector.getCurrentItem().getId());
						window.open(params.join(""), "_blank");



					} catch (e) {
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });
					}

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}

				});

				$("#contextmenu_newformeditor").click(function () {

					try {
						const temp = ctx.WebApi.RetrieveWithCustomFilter("RetrieveCurrentOrganization(AccessType=Microsoft.Dynamics.CRM.EndpointAccessType'Default')");
						const environmentId = temp["Detail"]["EnvironmentId"];



						window.open(
							`https://make.powerapps.com/e/${environmentId}/s/00000001-0000-0000-0001-00000000009b/entity/${Xrm.Page.data.entity.getEntityName().toLowerCase()}/form/edit/${Xrm.Page.ui.formSelector.getCurrentItem().getId()}?source=powerappsportal`,
							'_blank'
						);



					} catch (e) {
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });
					}

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}
				});
			},

			RIBBON: function () {

				//Ribbon
				$("#contextmenu_savechanges").click(function () {
					try {
						Xrm.Page.data.entity.save();

					} catch (e) {
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });
					}

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}
				});

				$("#contextmenu_saveandclose").click(function () {
					try {
						Xrm.Page.data.entity.save();
						window.history.back();



					} catch (e) {
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });
					}

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}
				});

				//Navigation


				$("#contextmenu_newrecord").click(function () {

					const params = ctx.GetEntityNameAndId();






					try {
						// Prompt the user for the entity schema name
						const entityName = params.entityname ? params.entityname : prompt("Enter Entity Schema Name:");

						// Check if the entity name is provided
						if (entityName) {
							var linkProps = [Xrm.Page.context.getClientUrl() + "/main.aspx"];
							linkProps.push("?etn=" + entityName.toLowerCase());
							linkProps.push("&newWindow=true");
							linkProps.push("&pagetype=entityrecord");
							window.open(linkProps.join(""), '_blank');
						} else {
							alert("Entity name is required. Please fill it and try again.");
						}
					} catch (e) {
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });
					}

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}

				});

				$("#contextmenu_deleterecord").click(function () {

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}



					const params = ctx.GetEntityNameAndId();
					if (!params.entityname || !params.entityid) {
						Xrm.Navigation.openErrorDialog({ message: "You are not on a form" });

					}

					Xrm.Utility.showProgressIndicator(`Deleting ${Xrm.Page.data.entity.getEntityName()} with ID ${Xrm.Page.data.entity.getId() }`);

					Xrm.WebApi.deleteRecord(Xrm.Page.data.entity.getEntityName(), Xrm.Page.data.entity.getId()).then(
						function success(result) {
							Xrm.Utility.closeProgressIndicator();

							window.history.back();
						},
						function (error) {
							Xrm.Utility.closeProgressIndicator();

							alert(error.message);
						}
					);


				});

				$("#contextmenu_debugribbon").click(function () {

					const debuggingParams = {
						flags: "FCB.CommandChecker=true",
						ribbondebug: true
					};

					const searchParams = new URLSearchParams(window.location.search);
					for (var param in debuggingParams) {
						const searchParam = searchParams.get(param);

						if (searchParam === null) {
							// add params
							alert("Ribbon debug: Command checker will be visible");

							searchParams.append(param, debuggingParams[param]);
						} else {
							// remove params
							alert("Ribbon debug: Command checker is hidden"); 

							searchParams.delete(param);
						}
					}

					setTimeout(() => {
						window.location.replace(`${window.location.protocol}//${window.location.host}${window.location.pathname}?${searchParams.toString()}`);
					}, 1000);



				});

				$("#contextmenu_refreshribbon").click(function () {
					try {
						Xrm.Page.ui.refreshRibbon();
						alert("Ribbon buttons are refreshed", "info");
					} catch (e) {
						Xrm.Navigation.openErrorDialog({ message: "Failed to refresh ribbon" });
					}

					if (document.getElementById('menuken')) {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}

				});


			},

			NAVIGATION: function () {

				// Register click event for advanced find button
				$("#contextmenu_advancedfind").click(function (e) {
					e.preventDefault(); // Prevent the default action
					let clientUrlForParams = Xrm.Page.context.getClientUrl(); // Get the client URL
					clientUrlForParams += (Xrm.Page.context.getClientUrl().indexOf('appid') > -1 ? '&' : '/main.aspx?'); // Append correct path

					// Open advanced find page based on whether the data entity exists
					if (!Xrm.Page.data || !Xrm.Page.data.entity) {
						window.open(`${clientUrlForParams}pagetype=advancedfind`, '_blank'); // Open advanced find
					} else {
						let entityName = Xrm.Page.data.entity.getEntityName(); // Get the entity name
						window.open(
							`${clientUrlForParams}extraqs=EntityCode%3d${Xrm.Internal.getEntityCode(entityName)}&pagetype=advancedfind`,
							'_blank' // Open advanced find for the entity
						);
					}
					document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
				});

				// Register click event for advanced settings button
				$("#contextmenu_systemsettings").click(function (e) {
					e.preventDefault(); // Prevent the default action
					window.open(Xrm.Page.context.getClientUrl() + "/main.aspx?settingsonly=true", '_blank'); // Open advanced settings
					document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
				});

				// Register click event for legacy security settings button
				$("#contextmenu_legacysecuritysettings").click(function (e) {
					e.preventDefault(); // Prevent the default action
					window.open(Xrm.Page.context.getClientUrl() + "/tools/business/home_role.aspx", '_blank'); // Open legacy security settings
					document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
				});

				// Register click event for default solution button
				$("#contextmenu_defaultsolution").click(function (e) {
					e.preventDefault(); // Prevent the default action
					var defaultSolutionId = "{FD140AAF-4DF4-11DD-BD17-0019B9312238}"; // Default solution ID
					window.open(Xrm.Page.context.getClientUrl() + "/tools/solution/edit.aspx?id=" + defaultSolutionId); // Open default solution
					document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
				});

				// Register click event for all solutions button
				$("#contextmenu_allsolutions").click(function (e) {
					e.preventDefault(); // Prevent the default action
					window.open(Xrm.Page.context.getClientUrl() + "/tools/Solution/home_solution.aspx?etc=7100", '_blank'); // Open all solutions
					document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
				});

				//// Register click event for username button
				//$("#username").click(function (e) {
				//	e.preventDefault(); // Prevent the default action
				//	const userSettings = Xrm.Utility.getGlobalContext().userSettings; // Get user settings
				//	var currentuserid = userSettings.userId; // Current user ID
				//	var userName = userSettings.userName; // Current user name
				//	let firstname = typeof userName === 'string' ? userName.trim().split(" ")[0] : ""; // Extract first name
				//	document.getElementById("username").innerHTML = firstname; // Set first name in the element
				//});

			
				// Function to handle opening the create form
				$("#contextmenu_opencreateform").click(function (e) {
					e.preventDefault(); // Prevent the default action
					document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					const name = prompt("What is the Entity Schema Name? (logicalname in lowercase)"); // Prompt for entity name
					openEntityRecord(name); // Open create form for the given entity name
				});

				// Function to handle opening a record by ID
				$("#contextmenu_openrecordbyid").click(function (e) {
					e.preventDefault(); // Prevent the default action
					document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					try {
						const name = prompt("What is the Entity Schema Name? (logicalname in lowercase)"); // Prompt for entity name
						const id = prompt("What is the Entity ID? (GUID)"); // Prompt for entity ID
						openEntityRecord(name, id); // Open record for the given entity name and ID
					} catch (error) {
						alert("Failed to open the record. Please try again."); // Alert user if failure occurs
						console.error("Error opening record:", error); // Log the error
					} finally {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}
				});

				// Register click event for opening a list
				$("#contextmenu_openlist").click(function (e) {
					e.preventDefault(); // Prevent the default action
					try {
						const name = prompt("What is the Entity Schema Name? (logicalname in lowercase)"); // Prompt for entity name
						if (name) {
							openList(name); // Open the list for the given entity name
						}
					} catch (e) {
						alert("Opening list failed"); // Alert user if failure occurs
					} finally {
						document.getElementById('menuken').classList.remove('menu-show'); // Hide menu
					}
				});

				// Helper function to open an entity record
				function openEntityRecord(name, id = null) {
					if (!name) {
						alert("You didn't enter a valid Entity Schema Name."); // Alert if no name is provided
						return;
					}

					const baseUrl = Xrm.Page.context.getClientUrl() + "/main.aspx"; // Base URL for entity record
					const linkProps = [`?etn=${name.toLowerCase()}`, "&pagetype=entityrecord"]; // Link properties

					// If an ID is provided, validate and append it to the link properties
					if (id) {
						if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
							alert("Invalid Entity ID format. It must be a valid GUID."); // Alert for invalid ID format
							return;
						}
						linkProps.push(`&id=${id}`); // Append ID to link properties
					}

					linkProps.push("&newWindow=true"); // Set to open in a new window
					window.open(baseUrl + linkProps.join(""), '_blank'); // Open entity record
				}

			

				// Function to open a list of entities
				function openList(entityName) {
					if (!entityName) {
						entityName = prompt('Entity?', ''); // Prompt for entity name if not provided
					}
					if (entityName) {
						let clientUrlForParams = Xrm.Page.context.getClientUrl(); // Get client URL
						clientUrlForParams += (Xrm.Page.context.getClientUrl().indexOf('appid') > -1 ? '&' : '/main.aspx?'); // Append correct path
						window.open(`${clientUrlForParams}etn=${entityName}&pagetype=entitylist`); // Open entity list
					}
				}

				// Function to retrieve data with custom filter

			},

			MODS: function () {

				// Register click event for dark mode radio button
				$("#contextmenu_darkmode").click(function (e) {
					e.preventDefault(); // Prevent the default action
					// Toggle dark mode flag in the URL
					if (window.location.href.indexOf("&flags=themeOption%3Ddarkmode") > -1) {
						window.history.replaceState(null, null, window.location.href.replace("&flags=themeOption%3Ddarkmode", ""));
					} else {
						window.history.replaceState(null, null, window.location.href + "&flags=themeOption%3Ddarkmode");
					}
					window.location.reload(); // Reload the page
				});
			},

			Menu: function (isDevelopment, hideDefaultContextMenu) {


				var menu = document.getElementById('menuken');

				function showMenu(x, y) {
					menu.style.left = x - 215 + 'px';
					//menu.style.left = x  + 'px';
					menu.style.top = y + 'px';
					menu.classList.add('menu-show');
					menu.style.display = 'block';
					console.log("menu shown for" + window.location.href)
				}

				function hideMenu() {
					menu.classList.remove('menu-show');
					menu.style.display = 'none';

				}

				function onContextMenu(e) {

					if (hideDefaultContextMenu) {
						e.preventDefault(); //still show the default context menu by commenting this
					}


					if (isDevelopment) {
						showMenu(e.pageX, e.pageY);

					}

					document.addEventListener('mousedown', onMouseDown, false);
				}

				function onMouseDown(e) {
					if (!menu.contains(e.target)) {
						hideMenu();
						document.removeEventListener('mousedown', onMouseDown);
					}
				}

				document.addEventListener('contextmenu', onContextMenu, false);

			},

			GetEntityNameAndId: function () {

				const url = window.location.href;
				let entityname = undefined;
				let entityid = undefined;

				if (url.includes("&pagetype=entitylist&etn=")) {
					const params = new URLSearchParams(url.split("?")[1]);
					entityname = params.get("etn");

				} else if (url.includes("&pagetype=entityrecord&etn=")) {
					const params = new URLSearchParams(url.split("?")[1]);
					entityname = params.get("etn");
					entityid = params.get("id");
					return { entityname, entityid }
				}

				return { entityname, entityid }

			},

			FormHelpers: {

				getAttributeContainer: function (attributeLogicalName) {
					var $container = window.$("#" + attributeLogicalName);

					if (!$container.length) {
						$container = window.$('[data-id="' + attributeLogicalName + '"]');
					}

					return $container;
				}
			},

			WebApi: {
				RetrieveWithCustomFilter: function (urlEnding) {
					var req = new XMLHttpRequest();
					var clientURL = Xrm.Page.context.getClientUrl();
					req.open("GET", clientURL + "/api/data/v8.1/" + urlEnding, false);
					req.setRequestHeader("Accept", "application/json");
					req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
					req.setRequestHeader("OData-MaxVersion", "4.0");
					req.setRequestHeader("OData-Version", "4.0");
					req.setRequestHeader("Prefer", 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"');
					req.send(null);
					return JSON.parse(req.responseText);
				}

			}

		};

		ctx.FORM();

		ctx.RIBBON();
		ctx.NAVIGATION();
		ctx.MODS();

		ctx.Menu(show_custom_context_menu, hide_default_context_menu);
	});
} catch (e) {
	console.info("XrmWebTools: failed to initialize the context menu");
}
