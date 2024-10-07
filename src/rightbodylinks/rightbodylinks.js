
try {
	$(function () {
		var CrmPowerPane = {
			ApplicationType: {
				DynamicsCRM: "Dynamics CRM",
				Dynamics365: "Dynamics 365"
			},
			Constants: {
				SlideTime: 250,
				NotificationClassPrefix: "crm-extension-",
				NotificationTimer: null
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
			RegisterEvents: function () {

				var Content, Xrm;

				var _getObjectTypeCode = function () {

					// The `etc` query string parameter is not available in UCI, so only show this
					// if it's available.
					var entityName = Xrm.Page.data.entity.getEntityName();
					var objectTypeCode = Xrm.Page.context.getQueryStringParameters().etc;
					if (!objectTypeCode) {
						// UCI - try getting the object type code using the internal API
						try {
							objectTypeCode = Xrm.Internal.getEntityCode(entityName);
						}
						catch (e) {
							/* do nothing */
						}
					}

					return objectTypeCode;
				}

				var _getAttributeContainer = function (attributeLogicalName) {
					var $container = Content.$("#" + attributeLogicalName);

					if (!$container.length) {
						$container = Content.$('[data-id="' + attributeLogicalName + '"]');
					}

					return $container;
				}

				var _getLabelElement = function (attributeLogicalName) {
					var $label = Content.$("#" + attributeLogicalName + "_c");

					if (!$label.length) {
						// Try to get the label for UCI
						$label = Content.$("label", '[data-id="' + attributeLogicalName + '"]');
					}

					return $label.length
						? Content.$($label[0]) // TODO: refactor later - yuck. inefficient jquery wrapping
						: null;
				}

				var _getSelectElement = function (attributeLogicalName) {
					var $select = Content.$('select.ms-crm-SelectBox[attrname=' + attributeLogicalName + ']');

					if (!$select.length) {
						// Try to get the dropdown for UCI
						$select = Content.$("select", '[data-id="' + attributeLogicalName + '"]');
					}

					return $select;
				};

				$(".crm-extension-subgroup").bindFirst('click', function () {
					Content = CrmPowerPane.TargetFrame.GetContent();
					Xrm = CrmPowerPane.TargetFrame.GetXrm();

				});

				//
				$(document).on("click", "#id-2", function (e) {



					if (document.getElementById("id-2").getAttribute("aria-expanded") === "true") {
						$(".rightBodyLinks").delay(100).hide();


					} else {
						$(".rightBodyLinks").delay(100).show();

					}
					//aria-expanded


					//
				});


				$(document).on("click", "#crm-extension-button", function (e) {

					if (window.location.href.indexOf("darkmode") > -1) {
						$('.crm-extension-sections').css('background-color', '#292929');
						$('.crm-extension-sections').css('color', 'white');


					} else {
						$('.crm-extension-sections').css('background-color', 'white');
						$('.crm-extension-sections').css('color', 'black');

					}

					$(".crm-extension-sections").slideToggle(CrmPowerPane.Constants.SlideTime);
					e.stopPropagation();
				});

				// Hide the pane if it is already open and the user clicked somewhere else.
				$(document).on("click", function () {
					$(".crm-extension-sections").delay(100).slideUp(CrmPowerPane.Constants.SlideTime);
				});

				$(window).on("blur", function () {
					$(".crm-extension-sections").delay(100).slideUp(CrmPowerPane.Constants.SlideTime);
				});

				$(".crm-extension-sections").click(function (e) {
					e.stopPropagation();
				});

				//#region Functions

				// Attach click event handler to the element with ID 'spa_logicalnames'
				$("#spa_logicalnames").click(function () {
					try {
						// Iterate through each control on the form
						Xrm.Page.ui.controls.forEach(function (control) {
							try {
								// Check if the control has setLabel and getName methods
								if (control && control.setLabel && control.getName) {
									// Save the original label if not already saved
									if (!control._$originalLabel) {
										control._$originalLabel = control.getLabel();
										// Create a new label using the control's logical name
										var newLabel = control.getName();
										// Set the new label
										control.setLabel(newLabel);
									}
								}
							} catch (e) {
								// Handle any errors silently for individual controls
							}
						});

						// Iterate through each tab on the form
						Xrm.Page.ui.tabs.forEach((tab) => {
							// Get the logical name of the tab
							const tabName = tab.getName();
							// Check if the tab is visible
							if (tab.getVisible()) {
								// Save the original label
								tab._$originalLabel = tab.getLabel();
								// Set the tab's label to its logical name
								tab.setLabel(tabName);
							}
						});

						// Show a notification indicating that logical names are enabled
						CrmPowerPane.UI.ShowNotification("CRM++ enabled Logical names");

					} catch (e) {
						// Show a warning if an error occurs (e.g., not on the expected page)
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});



				// Attach click event handler to the element with ID 'spa_entityname'
				$("#spa_entityname").click(function () {
					try {
						// Get the entity name of the current record
						const entityName = Xrm.Page.data.entity.getEntityName();

						// Initialize an array to hold the entity information
						const values = [
							{
								label: "Entity Name",
								value: entityName
							}
						];

						// Get the object type code if it exists
						const objectTypeCode = _getObjectTypeCode();
						if (objectTypeCode) {
							// Add the object type code to the values array
							values.push({
								label: "Entity Type Code",
								value: objectTypeCode
							});
						}

						// Build and display a popup with the entity information
						CrmPowerPane.UI.BuildOutputPopup(
							"Entity info",
							"Entity schema name of current record.",
							values
						);
					} catch (error) {
						// Show a warning if an error occurs (e.g., not on the expected page)
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				// Attach click event handler to the element with ID 'record-id'
				$("#record-id").click(function () {
					try {
						// Build and display a popup with the record ID information
						CrmPowerPane.UI.BuildOutputPopup(
							"Record id",                        // Title of the popup
							"Guid of current record.",          // Description of the popup
							[{
								label: "Record Id",              // Label for the record ID
								value: Xrm.Page.data.entity.getId() // Fetch and display the current record ID
							}]
						);
					} catch (e) {
						// Show a warning if an error occurs (e.g., not on the expected page)
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});


				// Attach click event handler to the element with ID 'record-url'
				$("#record-url").click(function () {
					try {
						// Define the header and description for the popup
						var header = "Record url";
						var description = "Url of current record.";

						// Construct the base URL for the current record
						var url = [Xrm.Page.context.getClientUrl() + "/main.aspx?"];
						url.push("etn=" + Xrm.Page.data.entity.getEntityName()); // Add entity name parameter
						url.push("&id=" + Xrm.Page.data.entity.getId()); // Add record ID parameter
						url.push("&pagetype=entityrecord"); // Specify the page type

						// Combine the URL parts into a single string
						var result = [{
							label: "Record Url",
							value: url.join("")
						}];

						// Check if Xrm.Utility and the method to get the current app properties are available
						if (Xrm.Utility && Xrm.Utility.getGlobalContext && Xrm.Utility.getGlobalContext().getCurrentAppProperties) {
							// Fetch the current application properties
							Xrm.Utility.getGlobalContext().getCurrentAppProperties().then(function (appDetails) {
								// Insert the app ID into the URL
								url.splice(1, 0, "appid=" + appDetails.appId + "&");
								// Add the modified URL to the result array
								result.push({
									label: "Record Url for Current Application",
									value: url.join("")
								});
								// Display the popup with the URLs
								CrmPowerPane.UI.BuildOutputPopup(header, description, result);
							});
						} else {
							// Display the popup with the base URL if app properties are not available
							CrmPowerPane.UI.BuildOutputPopup(header, description, result);
						}
					} catch (e) {
						// Show a warning if an error occurs (e.g., not on the expected page)
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#record-properties").click(function () {
					try {
						var id = Xrm.Page.data.entity.getId();
						var etc = _getObjectTypeCode();

						if (Content.Mscrm && Content.Mscrm.RibbonActions && Content.Mscrm.RibbonActions.openFormProperties) {
							Content.Mscrm.RibbonActions.openFormProperties(id, etc);
						}
						else {
							var recordPropertiesUrl = Xrm.Page.context.getClientUrl() + "/_forms/properties/properties.aspx?dType=1&id=" + id + "&objTypeCode=" + etc;
							var options = {
								width: 420,
								height: 505
							};

							if (Xrm.Internal.getAllowLegacyDialogsEmbedding()) {
								Xrm.Internal.openLegacyWebDialog(recordPropertiesUrl, options)
							}
							else {
								Xrm.Navigation.openUrl(recordPropertiesUrl, options);
							}
						}
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#go-to-record").click(function () {
					try {
						CrmPowerPane.UI.BuildInputPopup(
							"Go to record",
							"Redirects you to specific record by id.",
							[
								{
									label: "Entity Schema Name",
									name: "entityname"
								},
								{
									label: "Record Id",
									name: "recordid"
								}
							],
							function (popupObj) {
								var params = popupObj.Parameters;
								if (params.entityname.value && params.recordid.value) {
									var linkProps = [Xrm.Page.context.getClientUrl() + "/main.aspx"];
									linkProps.push("?etn=" + params.entityname.value.toLowerCase());
									linkProps.push("&id=" + params.recordid.value);
									linkProps.push("&pagetype=entityrecord");
									window.open(linkProps.join(""), '_blank');
								} else {
									CrmPowerPane.UI.ShowNotification("Entity name and record guid are required. Please fill them and try again.", "warning");
								}
							});
					} catch (e) {
						CrmPowerPane.UI.ShowNotification("An error ocurred while redirecting to specified record.", "error");
					}
				});

				$("#user-info").click(function () {
					try {
						function getUserRoles() {
							var userId = Xrm.Page.context.getUserId();
							var serverUrl = Xrm.Page.context.getClientUrl();
							var query = serverUrl + "/XRMServices/2011/OrganizationData.svc/SystemUserSet?$select=systemuserroles_association/Name,systemuserroles_association/RoleId&$expand=systemuserroles_association&$filter=SystemUserId eq guid'" + userId + "'";
							var service = new XMLHttpRequest();
							service.open("GET", query, false);
							service.setRequestHeader("X-Requested-Width", "XMLHttpRequest");
							service.setRequestHeader("Accept", "application/json, text/javascript, */*");
							service.send(null);
							var requestResults = eval('(' + service.responseText + ')').d;
							var results = requestResults.results[0].systemuserroles_association.results;
							return results.map(function (r) {
								return {
									name: r.Name,
									id: r.RoleId,
									entityType: "role"
								}
							})
						}
						function getUserTeams() {
							var userId = Xrm.Page.context.getUserId();
							var serverUrl = Xrm.Page.context.getClientUrl();
							var query = serverUrl + "/XRMServices/2011/OrganizationData.svc/SystemUserSet?$select=teammembership_association/Name,teammembership_association/TeamId&$expand=teammembership_association&$filter=SystemUserId eq guid'" + userId + "'";
							var service = new XMLHttpRequest();
							service.open("GET", query, false);
							service.setRequestHeader("X-Requested-Width", "XMLHttpRequest");
							service.setRequestHeader("Accept", "application/json, text/javascript, */*");
							service.send(null);
							var requestResults = eval('(' + service.responseText + ')').d;
							var results = requestResults.results[0].teammembership_association.results;
							return results.map(function (t) {
								return {
									name: t.Name,
									id: t.TeamId,
									entityType: "team"
								}
							})
						}

						CrmPowerPane.UI.BuildOutputPopup(
							"User Info",
							"Current user information",
							[{
								label: "User name",
								value: Xrm.Page.context.getUserName()
							},
							{
								label: "User id",
								value: Xrm.Page.context.getUserId()
							},
							{
								label: "User Roles",
								value: getUserRoles()
							},
							{
								label: "User Teams",
								value: getUserTeams()
							}
							]);
					} catch (e) {
						CrmPowerPane.UI.ShowNotification("An error occurred while getting the user information.", "error");
					}
				});

				$("#enable-all-fields").click(function () {
					try {
						Xrm.Page.ui.controls.forEach(function (c) {
							try {
								c.setDisabled(false);
							} catch (e) { }
						});

						CrmPowerPane.UI.ShowNotification("All fields are enabled.");
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#show-all-fields").click(function () {
					try {
						Xrm.Page.ui.controls.forEach(function (c) {
							try {
								c.setVisible(true);
							} catch (e) { }
						});

						Xrm.Page.ui.tabs.forEach(function (t) {
							try {
								if (t.setVisible) {
									t.setVisible(true);
								}

								if (t.sections && t.sections.getAll) {
									t.sections.getAll().forEach(function (s) {
										try {
											if (s && s.setVisible) {
												s.setVisible(true);
											}
										} catch (e) {

										}
									});
								}
							} catch (e) {

							}
						});

						CrmPowerPane.UI.ShowNotification("Visibility of all fields updated to visible.");
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#disable-field-requirement").click(function () {
					try {
						Xrm.Page.ui.controls.forEach(function (c) {
							try {
								if (c && c.getAttribute && c.getAttribute().setRequiredLevel)
									c.getAttribute().setRequiredLevel("none");
							} catch (e) { }
						});
						CrmPowerPane.UI.ShowNotification("Required level of all fields updated to none.");
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#schema-names").click(function () {
					try {
						var updateStatus;
						Xrm.Page.ui.controls.forEach(function (a) {
							try {
								if (a && a.setLabel && a.getName)
									if (!a._$originalLabel) {
										a._$originalLabel = a.getLabel();
										a.setLabel(a.getName());
										updateStatus = "update";
									}
									else {
										updateStatus = "rollback"
										a.setLabel(a._$originalLabel);
										a._$originalLabel = null;
									}
							} catch (e) { }
						});
						if (updateStatus == "update")
							CrmPowerPane.UI.ShowNotification("All labels updated to schema name.");
						else if (updateStatus == "rollback")
							CrmPowerPane.UI.ShowNotification("Schema name updates rolled back.");

						updateStatus = null;

					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#schema-names-as-desc").click(function () {
					try {
						var responsibleControls = ["standard", "optionset", "lookup"];
						Xrm.Page.ui.controls.forEach(function (control) {
							if (responsibleControls.indexOf(control.getControlType()) > -1) {
								var attributeLogicalName = control.getName(),
									attributeLabel = control.getLabel(),
									$label = _getLabelElement(attributeLogicalName)
								if ($label) {
									$label.attr("title", attributeLogicalName), $label.off("click").click(function () {
										var canCopy = document.queryCommandSupported("copy");
										if (canCopy) {
											var tempTextArea = document.createElement("textarea");
											tempTextArea.style.position = "absolute", tempTextArea.style.top = -9999, tempTextArea.style.left = -9999, tempTextArea.style.width = "2em", tempTextArea.style.height = "2em", tempTextArea.style.padding = 0, tempTextArea.style.border = "none", tempTextArea.style.outline = "none", tempTextArea.style.boxShadow = "none", tempTextArea.style.background = "transparent", tempTextArea.value = attributeLogicalName, document.body.appendChild(tempTextArea), tempTextArea.select();
											try {
												var didCopy = document.execCommand("copy");
												if (didCopy) {
													CrmPowerPane.UI.ShowNotification("Copied <b>\"" + attributeLogicalName + "\"</b> to clipboard.", "success");
												} else {
													CrmPowerPane.UI.ShowNotification("Copying failed. Please copy it yourself.", "error");
												}
											} catch (i) {
												console.log("Oops, unable to copy")
											}
											tempTextArea.remove();
										} else prompt("Copying is not supported. Please copy it yourself. " + attributeLabel, attributeLogicalName)
									})
								}
							}
						});
						CrmPowerPane.UI.ShowNotification("Schema name mode is activated for descriptions. You can copy it with label click."); // ui message will change
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#spa_schemanamesinbrackets").click(function () {
					try {
						var updateStatus;
						Xrm.Page.ui.controls.forEach(function (a) {
							try {
								if (a && a.setLabel && a.getName)
									if (!a._$originalLabel) {
										a._$originalLabel = a.getLabel();
										var newLabel = `${a.getLabel()} [${a.getName()}]`;
										a.setLabel(newLabel);
										updateStatus = "update";
									}
								//else {
								//	updateStatus = "rollback"
								//	a.setLabel(a._$originalLabel);
								//	a._$originalLabel = null;
								//}
							} catch (e) { }
						});
						//if (updateStatus == "update")
						//	CrmPowerPane.UI.ShowNotification("Added schema names in brackets.");
						//else if (updateStatus == "rollback")
						//	CrmPowerPane.UI.ShowNotification("Removed schema names in brackets.");

						updateStatus = null;

					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#refresh-form").click(function () {
					try {
						Xrm.Page.data.refresh();
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#toggle-lookup-links").click(function () {
					if (Content.$(".lookup-link").length !== 0) {
						Content.$(".lookup-link").remove();
						return;
					}
					Xrm.Page.ui.controls.forEach(function (control) {
						try {
							if (control.getControlType() === 'lookup') {

								var linkId = control.getName() + "-lookup-link";
								var externalIcon = '<svg id="i-external" viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M14 9 L3 9 3 29 23 29 23 18 M18 4 L28 4 28 14 M28 4 L14 18" /></svg>';
								var openInNewWindowLink = $('<a id="' + linkId + '" class="crm-extension-lookup-link" alt="Open this record in a new window" title="Open this record in a new window"  style="cursor: pointer;margin-left: 5px">' + externalIcon + '</a>');
								Content.$("#" + control.getName()).append(openInNewWindowLink);
								Content.$(openInNewWindowLink).click(function () {
									try {
										var attribute = control.getAttribute().getValue()[0];
										var url = Xrm.Page.context.getClientUrl() + "/main.aspx?etn=" + attribute.entityType + "&id=" + attribute.id + "&pagetype=entityrecord";
										window.open(url);
									} catch (e) { }
								});
							}
						} catch (e) { }
					});
				});

				$("#refresh-ribbon").click(function () {
					try {
						Xrm.Page.ui.refreshRibbon();
						CrmPowerPane.UI.ShowNotification("Ribbon refreshing.");
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#show-optionset-values").click(function () {

					try {
						Xrm.Page.ui.controls.forEach(function (control) {
							if (control.getControlType && control.getControlType() == "optionset") {
								var name = control.getName();
								var $selectBox = _getSelectElement(name)

								var $options = ($selectBox) ? $selectBox.find("option") : null;

								if ($options && $options.length > 0) {

									var changedOrReverted = null;

									for (var i = 0; i < $options.length; i++) {
										var $opt = $options[i];
										if ($opt.text != "" && $opt.value != "") {
											var exp = "#" + $opt.value + "# ";
											if ($opt.text.indexOf(exp) > -1) {
												$opt.text = $opt.text.replace(exp, "");
												$opt.title = $opt.title.replace(exp, "");
												changedOrReverted = "reverted";
											} else {
												$opt.text = "#" + $opt.value + "# " + $opt.text;
												$opt.title = "#" + $opt.value + "# " + $opt.title;
												changedOrReverted = "changed";
											}
										}

										if (changedOrReverted == "changed") {
											CrmPowerPane.UI.ShowNotification("Added value property to the option labels for all optionset. Like that <b>#value#</b>");
										} else if (changedOrReverted == "reverted") {
											CrmPowerPane.UI.ShowNotification("Removed value property from the option labels for all optionset.", "error");
										}

									}
								}
							}
						});
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}

				});

				$("#crm-diagnostics").click(function () {
					window.open(Content.Xrm.Page.context.getClientUrl() + "/tools/diagnostics/diag.aspx");
				});

				$("#mobile-client").click(function () {
					var url = Content.Xrm.Page.context.getClientUrl();
					window.open(url + "/nga/main.htm?org=" + Content.Xrm.Page.context.getOrgUniqueName() + "&server=" + url);
				});

				$("#performance-center").click(function () {
					Mscrm.Performance.PerformanceCenter.get_instance().TogglePerformanceResultsVisibility();
				});

				$("#show-dirty-fields").click(function () {
					try {
						Xrm.Page.ui.controls.forEach(function (control) {
							var attr = (control && control.getAttribute) ? control.getAttribute() : undefined;
							if (attr && attr.getIsDirty && attr.getIsDirty()) {
								var name = control.getName();
								_getAttributeContainer(name).css('background', '#FFFF00');
							}
						});
						CrmPowerPane.UI.ShowNotification("CRM++ highlighted dirty fields were");
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#clear-all-notifications").click(function () {
					try {
						Xrm.Page.ui.controls.forEach(function (c) {
							try {
								c.clearNotification();
							} catch (e) { }
						});
						CrmPowerPane.UI.ShowNotification("Notifications of all fields have been cleared.");
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#spa_openentityeditor").click(function () {
					try {
						CrmPowerPane.UI.BuildInputPopup(
							"Open Default Solution",
							"Opens default solution and optionally the specified entity.",
							[
								{
									label: "Entity Schema Name (optional)",
									name: "entityname",
									defaultValue: (Xrm && Xrm.Page
										&& Xrm.Page.data
										&& Xrm.Page.data.entity
										&& Xrm.Page.data.entity.getEntityName) ? Xrm.Page.data.entity.getEntityName() : null
								}
							],
							function (popupObj) {
								var entityDetail = "";
								var entityName = popupObj.Parameters.entityname.value;
								if (entityName && entityName.trim() != "") {
									var entityTypeCode = Xrm.Internal.getEntityCode(entityName);
									var entitiesCategoryCode = 9801; // undocumented
									entityDetail = "&def_category=" + entitiesCategoryCode + "&def_type=" + entityTypeCode
								}

								// ref https://docs.microsoft.com/en-us/previous-versions/dynamicscrm-2016/developers-guide/gg328257(v=crm.8)?redirectedfrom=MSDN#constant-solutionid-values
								var defaultSolutionId = "{FD140AAF-4DF4-11DD-BD17-0019B9312238}";

								window.open(Content.Xrm.Page.context.getClientUrl() + "/tools/solution/edit.aspx?id=" + defaultSolutionId + entityDetail);
								if (CrmPowerPane.TargetFrame.GetApplicationType() === CrmPowerPane.ApplicationType.DynamicsCRM) {
									return;
								}



								const temp = RetrieveWithCustomFilterXXX("RetrieveCurrentOrganization(AccessType=Microsoft.Dynamics.CRM.EndpointAccessType'Default')");
								const environmentId = temp["Detail"]["EnvironmentId"];

								let a = "";
								if (entityName) {
									a = "/" + Xrm.Page.data.entity.getEntityName();
								}

								setTimeout(() => window.open(
									`https://make.powerapps.com/environments/${environmentId}/entities/${environmentId}${a}`,
									'_blank'
								), 100);





							});
					} catch (e) {
						CrmPowerPane.UI.ShowNotification("An error ocurred while redirecting to entity editor.", "error");
					}
				});

				$("#spa_env_details").click(function () {
					try {

						const temp = RetrieveWithCustomFilterXXX("RetrieveCurrentOrganization(AccessType=Microsoft.Dynamics.CRM.EndpointAccessType'Default')");
						console.log("spa_env_details", temp);


						CrmPowerPane.UI.BuildOutputPopup(
							"Environment Details",
							"Environment Details Description",
							[
								{
									label: "environmentId",
									value: temp["Detail"]["EnvironmentId"]
								},
								{
									label: "DatacenterId",
									value: temp["Detail"]["DatacenterId"]
								}
								,
								{
									label: "FriendlyName",
									value: temp["Detail"]["FriendlyName"]
								},
								{
									label: "Geo",
									value: temp["Detail"]["Geo"]
								},
								{
									label: "OrganizationId",
									value: temp["Detail"]["OrganizationId"]
								},
								{
									label: "OrganizationType",
									value: temp["Detail"]["OrganizationType"]
								},
								{
									label: "OrganizationVersion",
									value: temp["Detail"]["OrganizationVersion"]
								},
								{
									label: "SchemaType",
									value: temp["Detail"]["SchemaType"]
								},
								{
									label: "State",
									value: temp["Detail"]["State"]
								},
								{
									label: "TenantId",
									value: temp["Detail"]["TenantId"]
								},
								{
									label: "UniqueName",
									value: temp["Detail"]["UniqueName"]
								},
								{
									label: "UrlName",
									value: temp["Detail"]["UrlName"]
								}
							],
							function (popupObj) {

							});



					} catch (e) {
						CrmPowerPane.UI.ShowNotification("An error ocurred while redirecting to entity editor.", "error");
					}
				});



				$("#show-field-value").click(function () {
					try {

						if (Xrm.Page.ui.getFormType() != 0) {
							CrmPowerPane.UI.BuildInputPopup(
								"Show Field Value",
								"Shows the field value on the form.",
								[
									{
										label: "Field Schema Name",
										name: "fieldname",
									}
								],
								function (popupObj) {

									var params = popupObj.Parameters;

									if (params.fieldname.value) {
										var control = Xrm.Page.getControl(params.fieldname.value);

										if (control && control.getControlType) {

											var controlType = control.getControlType();
											var outputParams = null;

											if (controlType == "optionset") {

												outputParams = [
													{
														label: "Selected Option Text",
														value: control.getAttribute().getText()
													},
													{
														label: "Selected Option Value",
														value: control.getAttribute().getValue()
													}
												];

											} else if (controlType == "lookup") {
												var controlValue = control.getAttribute().getValue();
												controlValue = (controlValue && controlValue.length > 0) ? controlValue[0] : null

												if (controlValue != null) {
													outputParams = [
														{
															label: "Name",
															value: controlValue.name
														},
														{
															label: "Id",
															value: controlValue.id
														},
														{
															label: "Entity Name",
															value: controlValue.entityType
														},
														{
															label: "Entity Type Code",
															value: controlValue.type
														}
													]
												} else {
													outputParams = [
														{
															label: "Name",
															value: null
														},
														{
															label: "Id",
															value: null
														},
														{
															label: "Entity Name",
															value: null
														},
														{
															label: "Entity Type Code",
															value: null
														}
													];
												}
											} else if (controlType == "standard") {
												outputParams = [
													{
														label: "Value",
														value: control.getAttribute().getValue()
													}
												];
											}
										}
									}
									if (outputParams) {
										popupObj.Description = "Control type of  <b>" + control.getLabel() + "(" + popupObj.Parameters.fieldname.value + ")</b> is " + controlType + ". The values like below."
										popupObj.Parameters = outputParams;
										popupObj.ShowData();
									} else {
										CrmPowerPane.UI.ShowNotification("The control type of your field is not recognized.", "warning");
									}
								},
								true);
						}

					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#find-field-in-form").click(function () {

					try {
						if (Xrm.Page.ui.getFormType() != 0) {
							CrmPowerPane.UI.BuildInputPopup(
								"Find Field On Form",
								"Finds and focus speicified field.",
								[
									{
										label: "Field Schema Name",
										name: "fieldname"
									}
								],
								function (popupObj) {
									var fieldName = popupObj.Parameters.fieldname.value;
									if (fieldName) {
										var control = Xrm.Page.getControl(fieldName);
										if (control && control.setFocus) {
											control.setFocus();
											var hiddenMessage = "";
											if (control.getVisible() == false) {
												hiddenMessage = "Control is <b>hidden</b>, it changed as visible.";
												control.setVisible(true);
											};
											CrmPowerPane.UI.ShowNotification("Focused on the " + fieldName + " field. " + hiddenMessage);
											Content.$("#" + control.getName()).css('background', '#FFFF00');
										}
									} else {
										CrmPowerPane.UI.ShowNotification(fieldName + " field could not be found.", "warning");
									}
								});
						}
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}

				});

				$("#spa_clonerecord").click(function () {
					try {
						var excludedFields = ["createdon", "createdby", "modifiedon", "modifiedby", "ownerid"];
						var collectedFields = [];

						Xrm.Page.data.entity.attributes.forEach(function (a) {
							var name = a.getName();
							var value = a.getValue();

							if (!value)
								return;

							if (excludedFields.indexOf(name) > -1)
								return;

							switch (a.getAttributeType()) {
								case "lookup":
									if (a.getLookupTypes()) {
										collectedFields.push(name + '=' + value[0].id);
										collectedFields.push(name + 'name=' + value[0].name);

										if (a.getLookupTypes().length > 1)
											collectedFields.push(name + 'type=' + value[0].entityType);
									}
									break;
								case "datetime":
									collectedFields.push(name + '=' + value.toLocaleDateString());
									break;
								default:
									collectedFields.push(name + '=' + value);
									break;
							}
						});

						var createUrl = Xrm.Page.context.getClientUrl()
							+ '/main.aspx?etn=' + Xrm.Page.data.entity.getEntityName()
							+ '&pagetype=entityrecord'
							+ '&extraqs=?' + encodeURIComponent(collectedFields.join('&'));

						window.open(createUrl, '_blank', "location=no,menubar=no,status=no,toolbar=no", false);
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}

				});

				$(".crm-extension-subgroup").click(function () {
					$(".crm-extension-sections").slideUp(CrmPowerPane.Constants.SlideTime);
				});

				$("#crm-extension").on("click", '.crm-extension-copy', function () {
					$(".crm-extension-copy").removeClass("crm-extension-copied").html("Copy it!")
					$input = $(this).parent().find("input").select();
					document.execCommand("copy");
					$(this).addClass("crm-extension-copied").html("Copied to clipboard!");
				});

				$("#crm-extension-popup-cancel").click(function () {
					$("#crm-extension-popup").fadeOut(CrmPowerPane.Constants.SlideTime);
					$("#crm-extension-popup-bg").fadeOut(CrmPowerPane.Constants.SlideTime);
				});

				$("#fetch-xml").click(function () {
					var $popupBg = $("#crm-extension-popup-bg");
					$popupBg.fadeIn(CrmPowerPane.Constants.SlideTime);
					var $fetchPopup = $("#crm-extension-fetchxml-popup");
					$fetchPopup.fadeIn(CrmPowerPane.Constants.SlideTime);

					var activeTabClass = "dynamics-crm-extension-active-tab";

					$("#crm-extension-fetchxml-popup-container ul li").removeClass(activeTabClass).first().addClass(activeTabClass);
					$(".crm-extension-fetchxml-tab").hide().first().show();

				});

				$("#crm-extension-fetchxml-popup-container ul li").click(function () {
					var activeClass = "dynamics-crm-extension-active-tab";
					$("#crm-extension-fetchxml-popup-container ul li").removeClass(activeClass);
					$(this).addClass(activeClass);
					$tabs = $(".crm-extension-fetchxml-tab");
					$tabs.hide();
					$tabs.eq($(this).index()).show();
				});

				$("#crm-extension-popup-cancel-fetch").click(function () {
					$("#crm-extension-fetchxml-popup").fadeOut(250);
					$("#crm-extension-popup-bg").fadeOut(250);
				});

				$("#crm-extension-popup-ok-fetch").click(function () {
					var xml = $("#crm-extension-tab1 textarea").val();
					if (xml.trim() == "") {
						return;
					}

					var $resultArea = $("#crm-extension-fetchxml-result-area");
					$resultArea.val("");
					$resultArea.css("color", "#000000");

					var request = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body>';
					request += '<Execute xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services">' + '<request i:type="b:RetrieveMultipleRequest" ' + ' xmlns:b="http://schemas.microsoft.com/xrm/2011/Contracts" ' + ' xmlns:i="http://www.w3.org/2001/XMLSchema-instance">' + '<b:Parameters xmlns:c="http://schemas.datacontract.org/2004/07/System.Collections.Generic">' + '<b:KeyValuePairOfstringanyType>' + '<c:key>Query</c:key>' + '<c:value i:type="b:FetchExpression">' + '<b:Query>';
					request += CrmEncodeDecode.CrmXmlEncode(xml);
					request += '</b:Query>' + '</c:value>' + '</b:KeyValuePairOfstringanyType>' + '</b:Parameters>' + '<b:RequestId i:nil="true"/>' + '<b:RequestName>RetrieveMultiple</b:RequestName>' + '</request>' + '</Execute>';
					request += '</s:Body></s:Envelope>';

					$.ajax({
						type: "POST",
						url: Xrm.Page.context.getClientUrl() + "/XRMServices/2011/Organization.svc/web",
						contentType: "text/xml",
						beforeSend: function (xhr) {
							xhr.setRequestHeader("Accept", "application/xml, text/xml, */*");
							xhr.setRequestHeader("SoapAction", "http://schemas.microsoft.com/xrm/2011/Contracts/Services/IOrganizationService/Execute");
						},
						data: request,
						dataType: "text",
						processData: false,
						success: function (data, status, req) {
							$resultArea.val(CrmPowerPane.Utils.PrettifyXml(data));
							$("#crm-extension-fetchxml-popup-container ul li").eq($resultArea.parent().index()).trigger("click");
						},
						error: function (err) {
							var errorDetails = err.statusText + "\n";
							errorDetails += err.responseText;
							$resultArea.val(errorDetails);
							$resultArea.css("color", "red");
							$("#crm-extension-fetchxml-popup-container ul li").eq($resultArea.parent().index()).trigger("click");
						}
					});
					return;
				});

				$("#spa_solutions").click(function () {
					window.open(Xrm.Page.context.getClientUrl() + "/tools/Solution/home_solution.aspx?etc=7100", '_blank');
				});

				$("#spa_gotocreateform").click(function () {
					try {
						CrmPowerPane.UI.BuildInputPopup(
							"Go to create form",
							"Redirects you to create form of specified entity. ",
							[
								{
									label: "Entity Schema Name",
									name: "entityname"
								}
							],
							function (popupObj) {
								var params = popupObj.Parameters;
								if (params.entityname.value) {
									var linkProps = [Xrm.Page.context.getClientUrl() + "/main.aspx"];
									linkProps.push("?etn=" + params.entityname.value.toLowerCase());
									linkProps.push("&newWindow=true");
									linkProps.push("&pagetype=entityrecord");
									window.open(linkProps.join(""), '_blank');
								} else {
									CrmPowerPane.UI.ShowNotification("Entity name is required. Please fill it and try again.", "warning");
								}
							});
					} catch (e) {
						CrmPowerPane.UI.ShowNotification("An error ocurred while redirecting to specified create form.", "error");
					}
				});
				$("#spa_showformid").click(function () {

					try {
						alert(Xrm.Page.ui.formSelector.getCurrentItem().getId())


					} catch (e) {
						CrmPowerPane.UI.ShowNotification("Does this look like a form to you ?", "error");
					}

				});

				$("#spa_showviewid").click(function () {

					// Get the current window URL
					const currentUrl = window.location.href;

					// Create a URL object from the current URL
					const urlObj = new URL(currentUrl);

					// Get the value of the 'viewid' parameter from the URL search parameters
					const viewId = urlObj.searchParams.get('viewid');


					if (viewId) {
						alert(viewId)
					}
					else {
						CrmPowerPane.UI.ShowNotification("View not found.", "error");

					}
					// Return the 'viewid' value

				});

				$("#spa_openformeditor").click(function () {

					try {
						var params = [Xrm.Page.context.getClientUrl() + "/main.aspx"];
						params.push("?pagetype=formeditor");
						params.push("&appSolutionId={FD140AAF-4DF4-11DD-BD17-0019B9312238}");
						params.push("&etn=" + Xrm.Page.data.entity.getEntityName().toLowerCase());
						params.push("&extraqs=formtype=main");
						params.push("&formId=" + Xrm.Page.ui.formSelector.getCurrentItem().getId());
						window.open(params.join(""), "_blank");


					} catch (e) {
						CrmPowerPane.UI.ShowNotification("An error ocurred while redirecting to form editor.", "error");
					}

				});

				$("#spa_openformeditornew").click(function () {

					try {
						const temp = RetrieveWithCustomFilterXXX("RetrieveCurrentOrganization(AccessType=Microsoft.Dynamics.CRM.EndpointAccessType'Default')");
						const environmentId = temp["Detail"]["EnvironmentId"];
						//alert("temp" + temp["Detail"]["EnvironmentId"])
						//console.log("temp", temp["Detail"]["EnvironmentId"]);
						//


						window.open(
							`https://make.powerapps.com/e/${environmentId}/s/00000001-0000-0000-0001-00000000009b/entity/${Xrm.Page.data.entity.getEntityName().toLowerCase()}/form/edit/${Xrm.Page.ui.formSelector.getCurrentItem().getId()}?source=powerappsportal`,
							'_blank'
						);

						//window.open(
						//	`https://make.powerapps.com/environments/${environmentId}/history`,
						//	'_blank'
						//);
					} catch (e) {
						CrmPowerPane.UI.ShowNotification("An error ocurred while redirecting to form editor.", "error");
					}
				});


				$("#open-webapi").click(function () {
					try {
						var apiVersion = Xrm.Utility.getGlobalContext().getVersion();
						var shortVersion = apiVersion.substring(3, apiVersion.indexOf(".") - 1);

						Xrm.Utility.getEntityMetadata(Xrm.Page.data.entity.getEntityName(), "")
							.then(function (result) {
								var url = Xrm.Page.context.getClientUrl() + "/api/data/v" + shortVersion + "/" + result.EntitySetName + "(" + Xrm.Page.data.entity.getId() + ")";
								url = url.replace("{", "").replace("}", "");
								window.open(url, '_blank');
							});

					} catch (e) {
						CrmPowerPane.UI.ShowNotification("An error occured opening the Web API URL for this record.");
					}
				});

				//#endregion Functions


				$("#spa_debug-ribbon").click(function () {

					const debuggingParams = {
						flags: "FCB.CommandChecker=true",
						ribbondebug: true
					};

					const searchParams = new URLSearchParams(window.location.search);
					for (var param in debuggingParams) {
						const searchParam = searchParams.get(param);

						if (searchParam === null) {
							// add params
							CrmPowerPane.UI.ShowNotification("Ribbon debug: true");

							searchParams.append(param, debuggingParams[param]);
						} else {
							// remove params
							CrmPowerPane.UI.ShowNotification("Ribbon debug: false");

							searchParams.delete(param);
						}
					}

					setTimeout(() => {
						window.location.replace(`${window.location.protocol}//${window.location.host}${window.location.pathname}?${searchParams.toString()}`);
					}, 1000);

				});



				$("#spa_clearlogicalnames").click(function () {

					if (CrmPowerPane.Utils.canNotExecute()) { return; }
					try {
						Xrm.Page.ui.controls.forEach(function (a) {
							try {
								if (a && a.setLabel && a.getName)
									a.setLabel(a._$originalLabel);
								a._$originalLabel = null;
							} catch (e) { }
						});

						Xrm.Page.ui.tabs.forEach((t) => {
							if (t.getVisible()) {
								t.setLabel(t._$originalLabel);
								t._$originalLabel = null;
							}


						});


					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}


					CrmPowerPane.UI.ShowNotification("CRM++ disabled logical names");
				});

				$("#spa_godmode").click(function () {

					if (CrmPowerPane.Utils.canNotExecute(true)) { return; }

					const selectedTab = Xrm.Page.ui.tabs.get((x) => x.getDisplayState() === 'expanded')[0];

					Xrm.Page.data.entity.attributes.forEach((a) => a.setRequiredLevel('none'));

					Xrm.Page.ui.controls.forEach((c) => {
						c.setVisible(true);
						if (c.setDisabled) { c.setDisabled(false); }
						if (c.clearNotification) { c.clearNotification(); }
					});

					Xrm.Page.ui.tabs.forEach((t) => {
						t.setVisible(true);
						t.setDisplayState('expanded');
						t.sections.forEach((s) => s.setVisible(true));
					});

					if (selectedTab.setFocus) {
						selectedTab.setDisplayState('expanded');
						selectedTab.setFocus();
					}

					//document.getElementById('spa_logicalnames').click();
					//setTimeout(function () { document.getElementById('spa_logicalnames').click() }, 100)

					CrmPowerPane.UI.ShowNotification("CRM ++Entered God Mode.");



				});

				$("#spa_godmodealways").click(function () {

					if (CrmPowerPane.Utils.canNotExecute(true)) { return; }

					try {
						var apiVersion = Xrm.Utility.getGlobalContext().getVersion();
						var shortVersion = apiVersion.substring(3, apiVersion.indexOf(".") - 1);
						Xrm.Utility.getEntityMetadata(Xrm.Page.data.entity.getEntityName(), "")
							.then(function (result) {
								var url = Xrm.Page.context.getClientUrl() + "/api/data/v" + shortVersion + "/" + result.EntitySetName + "(" + Xrm.Page.data.entity.getId() + ")";
								url = url.replace("{", "").replace("}", "");
								window.open(url + "#plusplus", '_blank');
							});

					} catch (e) {
						CrmPowerPane.UI.ShowNotification("Open a form to edit the record.");
					}

					/*
					document.getElementById('spa_godmode').click();
					var oldHash = window.location.href;
					setInterval(function () {
	
						if (oldHash !== window.location.href) {
	
							oldHash = window.location.href;
							document.getElementById('spa_godmode').click();
							setTimeout(function () { document.getElementById('spa_godmode').click() }, 1000)
							setTimeout(function () { document.getElementById('spa_godmode').click() }, 2000)
						}
					}, 1000);
	
	
					//CrmPowerPane.UI.ShowNotification("Entered God Mode Always...");
					Xrm.Page.ui.setFormNotification("Entered God Mode Always.", "INFO", "enteredgodmodealways_key");
					setTimeout(function () { Xrm.Page.ui.clearFormNotification("enteredgodmodealways_key"); }, 3000)
	
					*/
				});

				$("#pap_blurfields").click(function () {

					setFilter(Xrm.Page.getAttribute(), document, 'blur(5px)');
					//setFilter2(Xrm.Page.getAttribute(), document, 'blur(5px)');

					//setStyle("blurFieldsSheet", {
					//	'[data-id*="fieldControl"], [role="gridcell"], [data-id="header_title"], [id^=headerControlsList]>div>div:first-child': ['filter: blur(4px)']
					//});
				});

				$("#pap_resetblur").click(function () {

					setFilter(Xrm.Page.getAttribute(), document, '');
				});

				$("#spa_allfields").click(async function () {

					if (CrmPowerPane.Utils.canNotExecute(true)) { return; }

					let entityId = Xrm.Page.data.entity.getId();

					if (entityId) {
						let entityName = Xrm.Page.data.entity.getEntityName();

						let resultsArray = [{ cells: ['Attribute Name', 'Value'] }];
						fetchme(`EntityDefinitions(LogicalName='${entityName}')`, 'EntitySetName').then((entity) => {


							if (entity && entity.EntitySetName) {
								fetchme(entity.EntitySetName, null, null, entityId.substr(1, 36).toLowerCase()).then((r) => {
									let keys = Object.keys(r);
									keys.forEach((k) => {
										resultsArray.push({ cells: [k, r[k]] });
									});

									function sorteernekeer(a, b) {
										if (a.cells[0] < b.cells[0]) { return -1; }
										if (a.cells[0] > b.cells[0]) { return 1; }
										return 0;
									}
									const underscores = resultsArray.filter(x => x.cells[0].startsWith("_")).sort(sorteernekeer);
									const apenstaartjes = resultsArray.filter(x => x.cells[0].startsWith("@")).sort(sorteernekeer);
									const titel = resultsArray.filter(x => x.cells[0].startsWith("Attribute Name")).sort(sorteernekeer);
									const attributen = resultsArray.filter(x => !x.cells[0].startsWith("Attribute Name") && !x.cells[0].startsWith("@") && !x.cells[0].startsWith("_")).sort(sorteernekeer);
									const newresultsArray = [];
									for (const x of titel) { newresultsArray.push(x); }
									for (const x of attributen) { newresultsArray.push(x); }
									for (const x of underscores) { newresultsArray.push(x); }
									for (const x of apenstaartjes) { newresultsArray.push(x); }
									messageExtensionMe(newresultsArray, 'allFields');

									//let person = { firstName: "John", lastName: "Doe", age: 50, eyeColor: "blue" };
									//const ding = [];
									//for (var i = 0; i < resultsArray.length; i++) {
									//	ding.push({ label: resultsArray[i].cells[0], value: resultsArray[i].cells[1] });
									//	//ding.push({ label: resultsArray[i].cells[0] }, value: resultsArray[i].cells[1])
									//}
									//CrmPowerPane.UI.BuildOutputPopup(
									//	"allFields",
									//	"allFields information",
									//	ding);
								});
							}
						});
					}
				});

				$("#spa_changedfields").click(function () {
					try {
						Xrm.Page.ui.controls.forEach(function (control) {
							var attr = (control && control.getAttribute) ? control.getAttribute() : undefined;
							if (attr && attr.getIsDirty && attr.getIsDirty()) {
								var name = control.getName();
								_getAttributeContainer(name).css('background', '#FFFF00');
							}
						});

						CrmPowerPane.UI.ShowNotification("CRM ++highlighted dirty fields.");

					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}


				});



				$("#spa_recordurl").click(function () {
					try {
						var header = "CE";
						var description = "Url of current record.";

						var url = [Xrm.Page.context.getClientUrl() + "/main.aspx?"];
						url.push("etn=" + Xrm.Page.data.entity.getEntityName());
						url.push("&id=" + Xrm.Page.data.entity.getId());
						url.push("&pagetype=entityrecord");

						var result = [{
							label: "Record Url",
							value: url.join("")
						}];

						if (Xrm.Utility && Xrm.Utility.getGlobalContext && Xrm.Utility.getGlobalContext().getCurrentAppProperties) {
							Xrm.Utility.getGlobalContext().getCurrentAppProperties().then(function (appDetails) {
								url.splice(1, 0, "appid=" + appDetails.appId + "&");
								result.push({
									label: "Record Url for Current Application",
									value: url.join("")
								});
								CrmPowerPane.UI.BuildOutputPopup(header, description, result);
							});
						} else {
							CrmPowerPane.UI.BuildOutputPopup(header, description, result);
						}
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}

				});

				$("#spa_recordid").click(function () {

					try {
						let entityId = Xrm.Page.data.entity.getId().toLowerCase();
						if (entityId) {
							try {

								let t = document.createElement('input');
								t.setAttribute('id', 'copy');
								t.setAttribute('value', entityId.substr(1, 36));
								document.body.appendChild(t);
								t.select();
								document.execCommand('copy');
								t.remove();
								CrmPowerPane.UI.ShowNotification(`Record Id ${entityId.substr(1, 36)} has been copied to clipboard`);


							} catch (e) {
								prompt('Ctrl+C to copy. OK to close.', entityId);
							}
						} else {
							alert('This record has not been saved. Please save and run this command again');
						}
					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}

				});

				$("#spa_openwebapi").click(function () {
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
						CrmPowerPane.UI.ShowNotification("An error occured opening the Web API URL for this record.");
					}
				});

				$("#pap_refreshallsubgrids").click(function () {
					try {
						Xrm.Page.ui.controls.forEach(function (c) {
							if (c.getControlType() === 'subgrid') {

								c.refresh();
							}
						});

						CrmPowerPane.UI.ShowNotification("Refreshing all subgrids");


					} catch (e) {
						CrmPowerPane.UI.ShowNotification("An error occured opening the Web API URL for this record.");
					}
				});

				$("#spa_minimumvalues").click(function () {
					if (CrmPowerPane.Utils.canNotExecute()) { return; }

					try {
						//if (Xrm.Page.ui.getFormType() !== 1) {

						//	CrmPowerPane.UI.ShowNotification("This action can only be run on create form.");
						//	return;
						//}
						Xrm.Page.data.entity.attributes.forEach((a) => {
							if (a.getRequiredLevel() === 'required' && !a.getValue()) {
								switch (a.getAttributeType()) {
									case 'memo':
										a.setValue('memo');
										break;
									case 'string':
										a.setValue(a.getName());

										if (a.getName() === "emailaddress1") {
											a.setValue("test@mail.local");
										}

										if (a.getName() === "telephone1") {
											a.setValue("+32470000000");
										}
										break;
									case 'boolean':
										a.setValue(false);
										break;
									case 'datetime':
										a.setValue(new Date());
										break;
									case 'decimal':
									case 'double':
									case 'integer':
									case 'money':
										a.setValue((a).getMin());
										break;
									case 'optionset':

										a.setValue((a).getOptions()[0].value);
										break;
								}
							}
						});

						CrmPowerPane.UI.ShowNotification("CRM++ filled the form");

					} catch (e) {
						CrmPowerPane.UI.ShowNotification("An error occured opening the Web API URL for this record.");
					}
				});

				$("#spa_pap_showoptionsetvalues").click(function () {
					if (CrmPowerPane.Utils.canNotExecute(true)) { return; }

					let optionSets = Xrm.Page.getControl()
						.filter((x) => x.getControlType() === 'boolean' || x.getControlType() === 'optionset')
						.map((x) => ({
							name: x.getName(), options: (x.getAttribute()).getOptions()
						}));


					function sorteernekeer(a, b) {
						if (a.name < b.name) { return -1; }
						if (a.name > b.name) { return 1; }
						return 0;
					}
					optionSets = optionSets.sort(sorteernekeer)
					console.log("optionSets", optionSets)
					messageExtensionMe(optionSets, 'optionsets');
					//CrmPowerPane.UI.ShowNotification("todo");

				});




				$("#spa_dataverse_analytics").click(function () {
					window.open('https://admin.powerplatform.microsoft.com/analytics/d365ce');
				});

				$("#spa_powerplatformadmin").click(function () {
					window.open('https://admin.powerplatform.microsoft.com/home');
				});

				$("#spa_azureportal").click(function () {
					window.open('https://portal.azure.com/');
				});

				$("#pap_clonerecord").click(function () {
					let clientUrl =
						(Xrm.Page.context.getCurrentAppUrl && Xrm.Page.context.getCurrentAppUrl()) ||
						Xrm.Page.context.getClientUrl();

					let clientUrlForParams = clientUrl;

					if (!clientUrl.includes('main.aspx')) {
						clientUrlForParams += '/main.aspx';
					}

					let extraq = '';
					let entityName = Xrm.Page.data.entity.getEntityName();
					let fieldCount = 0;
					let isFieldCountLimitExceeded = false;

					Xrm.Page.data.entity.attributes.forEach((c) => {
						if (fieldCount > 45) {
							isFieldCountLimitExceeded = true;
							return;
						}
						let attributeType = c.getAttributeType();
						let attributeName = c.getName();
						let attributeValue = c.getValue();

						if (
							!attributeValue ||
							attributeName === 'createdon' ||
							attributeName === 'modifiedon' ||
							attributeName === 'createdby' ||
							attributeName === 'modifiedby' ||
							attributeName === 'processid' ||
							attributeName === 'stageid' ||
							attributeName === 'ownerid' ||
							attributeName.startsWith('transactioncurrency')
						)
							return;

						if (
							attributeType === 'lookup' &&
							!(c).getIsPartyList() &&
							attributeValue.length > 0
						) {
							let lookupValue = c;
							extraq += attributeName + 'name=' + attributeValue[0].name + '&';
							fieldCount++;
							if (
								attributeName === 'customerid' ||
								attributeName === 'parentcustomerid' ||
								(typeof lookupValue.getLookupTypes === 'function' &&
									Array.isArray(lookupValue.getLookupTypes()) &&
									lookupValue.getLookupTypes().length > 1)
							) {
								extraq += attributeName + 'type=' + attributeValue[0].entityType + '&';
								fieldCount++;
							}
							attributeValue = attributeValue[0].id;
						}

						if (attributeType === 'datetime') {
							attributeValue = (attributeValue).toDateString();
						}
						extraq += attributeName + '=' + attributeValue + '&';
						fieldCount++;
					});




					console.log(clientUrlForParams)
					console.log(entityName)
					console.log(clientUrlForParams +
						'&pagetype=entityrecord' +
						'&etn=' +
						entityName +

						'&extraqs=?' +
						encodeURIComponent(extraq))

					if (isFieldCountLimitExceeded) {
						alert('This form contains more than 45 fields and cannot be cloned');
					} else {
						let newWindowUrl =
							clientUrlForParams +
							'&pagetype=entityrecord' +
							'&etn=' +
							entityName +

							'&extraqs=?' +
							encodeURIComponent(extraq);
						window.open(newWindowUrl);
					}

				});

				$("#pap_refresh_autosaveoff").click(function () {
					Xrm.Page.data.refresh(false).then(
						() => {
							Xrm.Page.data.entity.addOnSave((econtext) => {
								let eventArgs = econtext.getEventArgs();
								if (eventArgs.getSaveMode() === 70 || eventArgs.getSaveMode() === 2) {
									eventArgs.preventDefault();
								}
							});
							CrmPowerPane.UI.ShowNotification("Form refreshed without save. Autosave turned off.");

						},
						(error) => {
							alert(error.message);
						}
					);

				});

				$("#spa_openrecordbyid").click(function () {
					try {
						CrmPowerPane.UI.BuildInputPopup(
							"Go to record",
							"Redirects you to specific record by id.",
							[
								{
									label: "Entity Schema Name",
									name: "entityname"
								},
								{
									label: "Record Id",
									name: "recordid"
								}
							],
							function (popupObj) {
								var params = popupObj.Parameters;
								if (params.entityname.value && params.recordid.value) {
									var linkProps = [Xrm.Page.context.getClientUrl() + "/main.aspx"];
									linkProps.push("?etn=" + params.entityname.value.toLowerCase());
									linkProps.push("&id=" + params.recordid.value);
									linkProps.push("&pagetype=entityrecord");
									window.open(linkProps.join(""), '_blank');
								} else {
									CrmPowerPane.UI.ShowNotification("Entity name and record guid are required. Please fill them and try again.", "warning");
								}
							});
					} catch (e) {
						CrmPowerPane.UI.ShowNotification("An error ocurred while redirecting to specified record.", "error");
					}
				});

				$("#spa_comingsoon").click(function () {

					CrmPowerPane.UI.ShowNotification("Coming Soon");
				});
				$("#spa_gobackwithoutsaving").click(function () {
					if (CrmPowerPane.Utils.canNotExecute()) { return; }

					try {

						const attributes = Xrm.Page.data.entity.attributes.get();

						for (const i of attributes) {
							i.setSubmitMode("never");
						}

						history.back();

					} catch (e) {
						history.back();

					}

				});
				$("#spa_undochanges").click(function () {
					if (CrmPowerPane.Utils.canNotExecute()) { return; }

					try {

						const attributes = Xrm.Page.data.entity.attributes.get();

						for (const i of attributes) {
							i.setSubmitMode("never");
						}

						location.reload();

					} catch (e) {
						location.reload();

					}
				});

				$("#spa_savechanges").click(function () {
					if (CrmPowerPane.Utils.canNotExecute()) { return; }

					Xrm.Page.data.entity.save();
				});

				$("#spa_clearallfields").click(function () {


					CrmPowerPane.UI.ShowNotification("Crm++ clearing all fields");

					const attributes = Xrm.Page.data.entity.attributes.get();

					for (const attribute of attributes) {


						attribute.setValue(null);

					}

				});
				let attributeMetadata = null;

				$("#spa_fillallfields2").click(function () {
					attributeMetadata = RetrieveAttributesMetaData(Xrm.Page.data.entity.getEntityName());
					const attributes = Xrm.Page.data.entity.attributes.get();
					console.log("spa_fillallfields2", attributes)

					for (const c of attributes) {
						const controlName = c.getName();
						console.log("spa_fillallfields2", c.getName())

						//const controlNodeT = document.querySelector(`[data-id="${controlName}1"] > div`);
						const controlNodeT = document.querySelector(`[data-id^="${controlName}"] > div`);

						console.log("spa_fillallfields2", controlNodeT)
						controlNodeT?.removeEventListener('click', onClickField);
						if (true)
							controlNodeT?.addEventListener('click', onClickField);
					};

					CrmPowerPane.UI.ShowNotification("CRM++ will now fill a field when clicked");


				});
				function onClickField(event) {
					const controlName = (event.currentTarget)?.parentElement?.getAttribute('data-control-name');
					if (!controlName) return;
					//console.log("onClickField" + controlName)
					//console.log("onClickField attributeMetadata", attributeMetadata)
					const metadata = attributeMetadata.value.find(meta => meta.LogicalName === controlName);
					//console.log("onClickField metadata", metadata)

					if (metadata && metadata['AttributeType']) {

						const randomValue = getRandomValue(Xrm.Page.getAttribute(controlName), metadata);
						//console.log("onClickField randomValue for " + controlName, randomValue)
						console.log("onClickField randomValue for " + controlName, randomValue)

						if (randomValue !== undefined) {
							CrmPowerPane.UI.ShowNotification(`CRM++ filled ${controlName}`);
							Xrm.Page.getAttribute(controlName).setValue(randomValue);

						}
					}

				}

				$("#spa_fillallfields").click(function () {

					try {


						CrmPowerPane.UI.ShowNotification("Crm++ filling all fields");

						const attributes = Xrm.Page.data.entity.attributes.get();
						const attributeMetadata = RetrieveAttributesMetaData(Xrm.Page.data.entity.getEntityName());

						for (const attribute of attributes) {

							const metadata = attributeMetadata.value.find(meta => meta.LogicalName === attribute.getName());

							if (!attribute.getValue() && metadata != undefined && metadata['AttributeType']) {

								const randomValue = getRandomValue(attribute, metadata);

								console.log("RANDOM FOUND " + attribute._attributeName, randomValue)

								if (randomValue !== undefined) {
									attribute.setValue(randomValue);
								}
							}

						}


					} catch (e) {
					}


				});

				function getRandomValue(attribute, metadata) {


					switch (metadata['AttributeType']) {
						case "Lookup":
							getRandomLookup(attribute, metadata);
							return undefined;
						case "String":
						case "Memo":
							return getRandomString(metadata.MaxLength, metadata.Format);
						case "Decimal":
						case "Double":
						case "Money":
						case "Integer":
						case "BigInt":
							return getRandomNumber(metadata.MinValue, metadata.MaxValue, metadata.Precision);
						case "DateTime":
							return getRandomDate(metadata.Format);
						case "Boolean":
						case "Status":
						case "State":
						case "Picklist":
						case "MultiSelectPicklist":
							return getRandomPickList(attribute, metadata);


						case "Uniqueidentifier":
						case "Null":
							return null;
					}
				}




				function getRandomNumber(minValue, maxValue, precision) {
					if (precision === void 0) { precision = 0; }
					var number = minValue + Math.random() * (maxValue - minValue);
					return Number(number.toFixed(precision));
				}

				function getRandomString(maxLength, format) {
					switch (format) {
						case "Email":

							return getRandomStringGenerator(Math.min((maxLength / 3), 15), false, true) + "@" +
								getRandomStringGenerator(Math.min((maxLength / 3), 10), false, true) + "." +
								getRandomStringGenerator(getRandomNumber(2, 3), false, true);
						case "Phone":
						case "Text":
						case "TextArea":
						case "TickerSymbol":
							return getRandomStringGenerator(Math.min((maxLength / 3), 50), true);
						case "URL":
							return "www." +
								getRandomStringGenerator(Math.min((maxLength / 3), 20)) + "." +
								getRandomStringGenerator(3);
					}
					return '';
				}

				function getRandomStringGenerator(maxLength, allowSpaces = false, forceLowerCase = false) {
					const length = maxLength;

					const characters = 'bcdfghjklmnpqrstvwxyz';
					const vowels = "aeiou";
					const charactersLength = characters.length;
					const vowelsLength = vowels.length;

					let result = '';
					let counter = 0;
					let nextCharIsVowel = false;
					while (counter < length) {

						if (allowSpaces && Math.random() < 0.1 && counter < length - 3 && result.at(-1) !== ' ') {
							result += ' ';
						}
						else {
							nextCharIsVowel = characters.includes(result.at(-1) ?? ' ') || (result.at(-1) === ' ' && Math.random() < 0.4);
							if (nextCharIsVowel)
								result += vowels.charAt(Math.floor(Math.random() * vowelsLength));
							else
								result += characters.charAt(Math.floor(Math.random() * charactersLength));
						}
						counter += 1;
					}
					if (!forceLowerCase) {
						const arr = result.split(' ');
						for (var i = 0; i < arr.length; i++) {
							arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1).toLowerCase();
						}
						return arr.join(' ');
					}
					else {
						return result;
					}
				}


				function getRandomPickList(attribute, me) {
					// Retrieve the OptionSet control using the control name
					var optionSetControl = Xrm.Page.getControl(attribute.getName());

					// Check if the control exists and is an OptionSet control
					if (optionSetControl && optionSetControl.getControlType() === "optionset") {
						// Retrieve the options available in the OptionSet
						var options = optionSetControl.getOptions();
						console.log("alloptions", options);
						var optionSetValues = [];

						// Iterate over the options and store their values
						for (var i = 0; i < options.length; i++) {
							optionSetValues.push(options[i].value);
						}

						// Generate a random index within the bounds of the optionSetValues array
						var randomIndex = Math.floor(Math.random() * optionSetValues.length);

						// Return the randomly selected value
						return optionSetValues[randomIndex];
					}
				}


				async function getRandomLookup(attribute, target) {

					const EntityLogicalName = target.Targets[0];
					console.log("getRandomLookup for " + EntityLogicalName)

					var randomIndex = getRandomNumber(1, 5);
					var primaryIdAttribute = EntityLogicalName + "id";//await Xrm.Utility.getEntityMetadata(target.LogicalName, [target.LogicalName +""])""

					console.log("getRandomLookup primaryIdAttribute =" + primaryIdAttribute)


					//console.log("getRandomLookup primaryIdAttribute", primaryIdAttribute)

					var primaryNameAttribute = (await Xrm.Utility.getEntityMetadata(EntityLogicalName)).PrimaryNameAttribute;
					console.log("getRandomLookup primaryNameAttribute =" + primaryNameAttribute)

					var record = (await Xrm.WebApi.online.retrieveMultipleRecords(EntityLogicalName, "?$select=" + primaryIdAttribute + "," + primaryNameAttribute, randomIndex)).entities[randomIndex - 1];
					if (!record) {
						return null;

					}

					var lookup_found = [{
						id: record[primaryIdAttribute],
						name: record[primaryNameAttribute],
						entityType: EntityLogicalName,
					}]
					console.log("getRandomLookup lookup_found =", lookup_found)
					console.log("getRandomLookup lookup_found attribute=", attribute)

					attribute.setValue(lookup_found);

					//console.log("getRandomLookup recfou", lookup_found)
					//return [{
					//	id: record[primaryIdAttribute],
					//	name: record[primaryNameAttribute],
					//	entityType: EntityLogicalName,
					//}];
				}

				function getRandomDate(format) {
					var start = new Date(1753, 1, 1);
					var end = new Date(9999, 12, 31);
					return new Date(getRandomNumber(start.getTime(), end.getTime()));
				}


				$("#spa_todo2").click(function () {

					CrmPowerPane.UI.ShowNotification("Coming Soon");
				});
				$("#spa_todo3").click(function () {

					CrmPowerPane.UI.ShowNotification("Coming Soon");
				});
				$("#spa_todo4").click(function () {

					CrmPowerPane.UI.ShowNotification("Coming Soon");
				});
				$("#spa_todo5").click(function () {

					CrmPowerPane.UI.ShowNotification("Coming Soon");
				});
				$("#spa_todo6").click(function () {

					CrmPowerPane.UI.ShowNotification("Coming Soon");
				});
				$("#spa_todo7").click(function () {

					CrmPowerPane.UI.ShowNotification("Coming Soon");
				}); $("#spa_metadata").click(function () {


					//https://mediahuis - dev - mhc - core.crm4.dynamics.com / api / flow / v1.0 / $metadata.json / entities / accounts

					if (CrmPowerPane.Utils.canNotExecute(true)) { return; }

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
						CrmPowerPane.UI.ShowNotification("failed to open metadata for this record.");
					}



				});

				$("#spa_todo9").click(function () {

					CrmPowerPane.UI.ShowNotification("Coming Soon");
				});

				$("#spa_deleterecord").click(function () {

					if (CrmPowerPane.Utils.canNotExecute(true)) { return; }



					Xrm.WebApi.deleteRecord(Xrm.Page.data.entity.getEntityName(), Xrm.Page.data.entity.getId()).then(
						function success(result) {
							alert(Xrm.Page.data.entity.getEntityName() + " deleted");
							// perform operations on record deletion
						},
						function (error) {
							alert(error.message);
							// handle error conditions
						}
					);


				});




				$("#spa_fillallfields0").click(function () {

					CrmPowerPane.UI.ShowNotification(Xrm.Page.context
						.getVersion());
				});


				$("#spa_fillallfields1").click(function () {

					CrmPowerPane.UI.ShowNotification("Coming Soon");
				});



				$("#spa_MyUserRecord").click(function () {

					var linkProps = [Xrm.Page.context.getClientUrl() + "/main.aspx"];
					linkProps.push("?etn=systemuser");
					linkProps.push("&id=" + Xrm.Page.context.getUserId());
					linkProps.push("&pagetype=entityrecord");
					window.open(linkProps.join(""), '_blank');
				});

				$("#spa_opensystemjobs").click(function () {

					openList('asyncoperation');

				});

				$("#spa_plugintracelog").click(function () {

					openList('plugintracelog');

				});

				$("#spa_nextrelease").click(function () {

					openSolution("NextRelease");
				});

				$("#spa_webresource").click(function () {
					const succeeded = openSolution("CIWebResourceDeploy");

				});

				$("#spa_openadvfind").click(function () {
					let clientUrlForParams = Xrm.Page.context.getClientUrl();
					clientUrlForParams += (Xrm.Page.context.getClientUrl().indexOf('appid') > -1 ? '&' : '/main.aspx?');

					if (!Xrm.Page.data || !Xrm.Page.data.entity) {
						window.open(`${clientUrlForParams}pagetype=advancedfind`, '_blank');
					} else {
						let entityName = Xrm.Page.data.entity.getEntityName();
						window.open(
							`${clientUrlForParams}extraqs=EntityCode%3d${Xrm.Internal.getEntityCode(
								entityName
							)}&pagetype=advancedfind`,
							'_blank'
						);
					}

				});

				$("#spa_gotolist").click(function () {
					try {
						CrmPowerPane.UI.BuildInputPopup(
							"Go to List",
							"Redirects you to a list.",
							[
								{
									label: "Entity Schema Name",
									name: "entityname"
								}
							],
							function (popupObj) {
								var params = popupObj.Parameters;
								if (params.entityname.value) {
									var linkProps = [Xrm.Page.context.getClientUrl() + "/main.aspx"];
									linkProps.push("?etn=" + params.entityname.value.toLowerCase());

									linkProps.push("&pagetype=entitylist");
									window.open(linkProps.join(""), '_blank');
								} else {
									CrmPowerPane.UI.ShowNotification("Entity name is required. Please fill them and try again.", "warning");
								}
							});
					} catch (e) {
						CrmPowerPane.UI.ShowNotification("An error ocurred while redirecting to specified list.", "error");
					}
				});

				$("#spa_processes").click(function () {
					openList('workflow');
				});


				$("#spa_legacyroles").click(function () {


					window.open(Xrm.Page.context.getClientUrl() + "/tools/business/home_role.aspx", '_blank');




				});

				$("#spa_perfcenter").click(function () {



					if (window.location.href.indexOf("perf=true") > -1) {
						window.history.replaceState(null, null, window.location.href.replace("&perf=true", ""));
					} else {
						window.history.replaceState(null, null, window.location.href + "&perf=true");
					}

					window.location.reload();


				});


				$("#spa_diagnostics").click(function () {



					window.open(Xrm.Page.context.getClientUrl() + "/tools/diagnostics/diag.aspx/GetMetrics", '_blank');

					//

				});

				$("#spa_adv_settings").click(function () {


					window.open(Xrm.Page.context.getClientUrl() + "/main.aspx?settingsonly=true", '_blank');

					//main.aspx?settingsonly=true

				});

				$("#spa_mailboxes").click(function () {
					openList('mailbox')


					//main.aspx?settingsonly=true

				});


				$("#spa_darkmode").click(function () {
					if (window.location.href.indexOf("&flags=themeOption%3Ddarkmode") > -1) {
						window.history.replaceState(null, null, window.location.href.replace("&flags=themeOption%3Ddarkmode", ""));
						$('.crm-extension-sections').css('background-color', 'white');

					} else {
						window.history.replaceState(null, null, window.location.href + "&flags=themeOption%3Ddarkmode");
						$('.crm-extension-sections').css('background-color', '#292929');

					}

					window.location.reload();
					//https://hackingpowerplatform.com/dark-mode-for-microsoft-dataverse/
				});

				$("#spa_popup").click(function () {
					try {

						let onAccountForm = false;
						try {
							const domain = new URL(Xrm.Page.context.getClientUrl()).hostname; // Get the hostname
							const extracted = domain.split('-')[0]; // Extract the first part before any hyphen
							const temp = extracted.charAt(0).toUpperCase() + extracted.slice(1) || null; // Capitalize the first letter
							const userId = Xrm.Utility.getGlobalContext().userSettings.userId.replace(/[{}]/g, "").toLowerCase();
							const orgUniqueName = Xrm.Page.context.getOrgUniqueName();
							const key = `${orgUniqueName}_${temp}Cache_BaseForm${temp}_loadUserInfo_${userId}`;
							if (window.localStorage && window.localStorage.getItem(key)) {
								onAccountForm = window.location.href.endsWith("pagetype=entityrecord&etn=account");
							}
						} catch (error) {
							console.log("Invalid URL:", error);
						}
						var userSettings = Xrm.Utility.getGlobalContext().getUserName();
						document.getElementById("username").innerHTML = userSettings + " " + onAccountForm;
					} catch (e) {
						console.error(e.message)
					}
				});

				// Event handler for the click event on the element with ID "spa_newaccount"
				$("#spa_newaccount").click(function () {

					//Xrm.Utility.showProgressIndicator("filling in " + obj.denomination)


					const jsonString = document.getElementById("newaccount").innerHTML;
					const obj = JSON.parse(jsonString)
					const name = obj.denomination;                     // e.g., "David"
					setValue("name", name);
					setValue("mhc_tradename", obj.denomination_with_legal_form);

					const mhc_source_customer = 862960008;
					setValue("mhc_source_customer", mhc_source_customer)
					setValue("mhc_samevisit", true, true)
					setValue("mhc_address1_countryid", [{
						id: "b5a6fa8b-6b90-ea11-a811-000d3ab3900c",
						name: "BELGIUM",
						entityType: "mhc_country"
					}], true);

					const address1_postalcode = obj.address.post_code;
					setValue("address1_postalcode", address1_postalcode, true)

					const address1_city = obj.address.city;
					setValue("address1_city", address1_city, true)

					const address1_line1 = obj.address.street;
					setValue("address1_line1", address1_line1, true)

					const address1_line2 = obj.address.street_number;
					setValue("address1_line2", address1_line2, true)

					const address1_line3 = obj.address.box;
					setValue("address1_line3", address1_line3, true)

					setValue("mhc_branchid", [{
						id: "a57d54e0-05ef-41cc-985d-033d8e61238b",
						name: "Other",
						entityType: "mhc_branch"
					}], false);

					setValue("mhc_subbranchid", [{
						id: "b58c2032-b709-4478-830e-c3c2568b32ac",
						name: "Other",
						entityType: "mhc_branch"
					}], false);

					if (obj.contact_infos) {

						const emailaddress1 = obj.contact_infos.email;
						setValue("emailaddress1", emailaddress1, false)

						const telephone1 = obj.contact_infos.phone;
						setValue("telephone1", telephone1, false)

						const websiteurl = obj.contact_infos.web;
						setValue("websiteurl", websiteurl, false)


					}
					//setValue("mhc_vatknown", true, false)
					setValue("mhc_vatnumber", "BE" + obj.cbe_number_formatted, true)

					if (obj.start_date) {
						setValue("description", "Start Date: " + obj.start_date, false)

					}
				});

				function setValue(field, newValue, triggerOnchange = false) {


					var attribute = Xrm.Page.getAttribute(field);

					attribute.setValue(newValue);
					if (triggerOnchange) { attribute.fireOnChange(); }
				};


			},
			RegisterEvents2: function () {

				$("#rbl_logicalnames").click(function (e) {
					e.preventDefault();
					try {
						var updateStatus;
						Xrm.Page.ui.controls.forEach(function (a) {
							try {
								if (a && a.setLabel && a.getName)
									if (!a._$originalLabel) {
										a._$originalLabel = a.getLabel();
										var newLabel = `${a.getLabel()} (${a.getName()})`;
										a.setLabel(newLabel);
										updateStatus = "update";
									}

							} catch (e) { }
						});


						updateStatus = null;

					} catch (e) {
						CrmPowerPane.Errors.WrongPageWarning();
					}
				});

				$("#rbl_godmode").click(function (e) {
					e.preventDefault();

					try {

						const selectedTab = Xrm.Page.ui.tabs.get((x) => x.getDisplayState() === 'expanded')[0];

						Xrm.Page.data.entity.attributes.forEach((a) => a.setRequiredLevel('none'));

						Xrm.Page.ui.controls.forEach((c) => {
							c.setVisible(true);
							if (c.setDisabled) { c.setDisabled(false); }
							if (c.clearNotification) { c.clearNotification(); }
						});

						Xrm.Page.ui.tabs.forEach((t) => {
							t.setVisible(true);
							t.setDisplayState('expanded');
							t.sections.forEach((s) => s.setVisible(true));
						});

						if (selectedTab.setFocus) {
							selectedTab.setDisplayState('expanded');
							selectedTab.setFocus();
						}

					} catch (e) {
						alert("Godmode failed")
					}
				});

				$("#rbl_darkmode").click(function (e) {
					e.preventDefault();

					if (window.location.href.indexOf("&flags=themeOption%3Ddarkmode") > -1) {
						window.history.replaceState(null, null, window.location.href.replace("&flags=themeOption%3Ddarkmode", ""));

					} else {
						window.history.replaceState(null, null, window.location.href + "&flags=themeOption%3Ddarkmode");

					}

					window.location.reload();
				});

				$("#rbl_advancedfind").click(function (e) {
					e.preventDefault();

					let clientUrlForParams = Xrm.Page.context.getClientUrl();
					clientUrlForParams += (Xrm.Page.context.getClientUrl().indexOf('appid') > -1 ? '&' : '/main.aspx?');

					if (!Xrm.Page.data || !Xrm.Page.data.entity) {
						window.open(`${clientUrlForParams}pagetype=advancedfind`, '_blank');
					} else {
						let entityName = Xrm.Page.data.entity.getEntityName();
						window.open(
							`${clientUrlForParams}extraqs=EntityCode%3d${Xrm.Internal.getEntityCode(
								entityName
							)}&pagetype=advancedfind`,
							'_blank'
						);
					}
				});

				//	//
				$("#username").click(function (e) {
					e.preventDefault();
					const userSettings = Xrm.Utility.getGlobalContext().userSettings;

					var currentuserid = userSettings.userId;
					var userName = userSettings.userName;
					let firstname = typeof userName === 'string' ? userName.trim().split(" ")[0] : "";

					document.getElementById("username").innerHTML = firstname;

				});

				$("#openxrmwebtools").click(function (e) {
					e.preventDefault();
					window.open(`${Xrm.Page.context.getClientUrl()}/xrmwebtools`, '_blank');
				});






			}
		};

		//CrmPowerPane.UI.SetButtonBackgrounds();
		//CrmPowerPane.RegisterjQueryExtensions();
		CrmPowerPane.RegisterEvents2();




	});
} catch (e) {
	//alert("oopsie");
	if (document.getElementById("rightBodyLinks")) {
		document.getElementById("rightBodyLinks").style.visibility = "hidden";
	}
}
