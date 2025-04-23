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
console.info("Plugin Registration Tool: init");
setTimeout(() => document.getElementById("XrmWebTools").style.display = "block", 50);
document.getElementById("connect").innerHTML = `Connected to: ${window.location.origin}`;

const PluginRegistrationTool = {

	//Declaratie van de variabelen
	lastSelectedAssembly_ID: "",
	lastSelectedPluginType_ID: {},
	lastSelectedPluginStep_ID: "",
	pluginassemblies_cached: [],
	plugintypes_cached: [],

	//WEBAPI
	WebApi: {
		// Method to retrieve data with a custom filter
		RetrieveWithCustomFilter: async (urlEnding) => {
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
						'Prefer': 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"'
					}
				});

				if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
				return await response.json();
			} catch (error) {
				console.error(`Error retrieving data: ${error.message}`);
				throw error;
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
			const clientURL = window.location.origin;
			req.open("GET", encodeURI(clientURL + "/api/data/v9.2/" + entityName + "(" + id + ")?" + select), false);
			req.setRequestHeader("Accept", "application/json");
			req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
			req.setRequestHeader("OData-MaxVersion", "4.0");
			req.setRequestHeader("OData-Version", "4.0");
			req.setRequestHeader("Prefer", 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"');
			req.send(null);
			return JSON.parse(req.responseText);
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
		},
		DeleteAsync: async function (entityName, entityId) {
			return new Promise((resolve, reject) => {
				entityName = entityName + "s";
				const clientURL = window.location.origin;

				var req = new XMLHttpRequest();
				req.open("DELETE", clientURL + "/api/data/v9.2/" + entityName + "(" + entityId + ")", true);
				req.setRequestHeader("Accept", "application/json");
				req.setRequestHeader("OData-MaxVersion", "4.0");
				req.setRequestHeader("OData-Version", "4.0");

				req.onreadystatechange = function () {
					if (this.readyState === 4) {
						req.onreadystatechange = null;
						if (this.status === 204) {
							// Success - Entity successfully deleted
							resolve("Entity deleted successfully.");
						} else {
							reject(JSON.parse(this.response));
						}
					}
				};

				req.send();
			});
		}


	},

	treeView: async (element) => {
		element.addEventListener("click", async (e) => {
			const target = e.target;


			if (target.classList.contains("branch-node")) {
				//	verkeerd geklikt patj
				return;

			} else if (target.classList.contains("branch-title")) {


				const isAssembly = target.parentNode.parentNode.id === "my-tree-view"; // Top-level assembly

				if (isAssembly) {



					const assemblyId = target.getAttribute("data-id"); // Retrieve the assembly ID from the data-id attribute
					PluginRegistrationTool.lastSelectedAssembly_ID = assemblyId;
					// Check if this assembly has already been loaded
					if (!target.parentNode.hasAttribute("data-assembly-loaded")) {

						target.parentNode.setAttribute("data-assembly-loaded", "true"); // Mark assembly as loaded

						// Expand all plugintypes under the assembly
						const childBranches = target.parentNode.querySelectorAll(".branch-node");


						// Load steps dynamically for each plugintype
						childBranches.forEach(async (branch) => {
							// Check if the branch already has steps loaded
							if (!branch.hasAttribute("data-steps-loaded")) {
								branch.setAttribute("data-steps-loaded", "true"); // Mark as loaded
								//console.log(`Fetching steps for plugin: ${branch.querySelector(".branch-title").innerText}`);
								const branchTitle = branch.querySelector(".branch-title");

								let pluginName = branchTitle.textContent.trim();
								pluginName = pluginName.replace(/^\(Plugin\) \s*/, '');

								const sdkSteps = await PluginRegistrationTool.WebApi.RetrieveWithCustomFilter(
									`sdkmessageprocessingsteps?$orderby=createdon asc&$filter=contains(name,'${pluginName}')`
								);

								// Add steps to the plugin type
								sdkSteps.value.forEach(step => {

									const step_statecode = step["statecode@OData.Community.Display.V1.FormattedValue"];


									const testBranch = document.createElement('li');
									testBranch.classList.add('branch-node', 'test-branch');
									testBranch.innerHTML = `<div class="branch-title">(${step_statecode}) ${step.name} [${step.filteringattributes}]</div>`;

									const pluginTypesList = branch.querySelector('ul');
									if (pluginTypesList) {
										pluginTypesList.appendChild(testBranch);
									} else {
										const newUl = document.createElement('ul');
										newUl.classList.add('branches');
										newUl.appendChild(testBranch);
										branch.appendChild(newUl);
									}

									testBranch.addEventListener('click', async (e) => {
										e.stopPropagation();  // Stop propagation to avoid event bubbling
										//console.log("Clicked target2:", e.target);

										// Check if there is already a nested "image" branch
										const existingImageBranch = testBranch.querySelector(".image-branch");
										if (false &&!existingImageBranch) {
											//console.log('Plugin step clicked, adding image branch');


											// Create the "image" branch
											const imageBranch = document.createElement('li');
											imageBranch.classList.add('branch-node', 'image-branch');
											imageBranch.innerHTML = `<div class="branch-title">Image</div>`;

											// Check if the testBranch already has a child list (UL)
											let branchList = testBranch.querySelector('ul');
											if (!branchList) {
												branchList = document.createElement('ul'); // Create a new UL if none exists
												branchList.classList.add('branches');
												testBranch.appendChild(branchList);
											}

											// Append the new image branch to the list
											branchList.appendChild(imageBranch);

										} else {
										}

										PluginRegistrationTool.removeSelectedElements()
										await PluginRegistrationTool.onPluginStepClick(step);
										if (!e.target.classList.contains('selected')) {
											e.target.classList.add('selected');
										}

										testBranch.classList.toggle("open");

									});

								});
							} else {
								//	console.log(`Steps for plugin ${branch.querySelector(".branch-title").innerText} already loaded.`);
							}
						});
					} else {
						//	console.log(`Assembly ID ${assemblyId} already loaded.`);
					}
				}

				const isOpen = target.parentNode.classList.contains("open");
				if (isOpen) {
					const childBranches = target.parentNode.querySelectorAll(".branch-node");
					childBranches.forEach(branch => {
						branch.classList.remove("open"); // Close the child branch
					});
				}

				PluginRegistrationTool.removeSelectedElements()

				if (!e.target.classList.contains('selected')) {
					e.target.classList.add('selected');
				}
				// Toggle open/close for the clicked assembly
				target.parentNode.classList.toggle("open");
			}
		});
	},
	onAssemblyClick: function (assembly) {
		console.log("PRT.onAssemblyClick", assembly);

		document.getElementById("card_assembly").style.display = "block";
		document.getElementById("card_plugin").style.display = "none";
		document.getElementById("card_pluginstep").style.display = "none";

	},
	onPluginClick: function (plugin) {
		console.log("PRT.onPluginClick", plugin);
		PluginRegistrationTool.lastSelectedPluginType_ID = plugin

		document.getElementById("card_assembly").style.display = "none";
		document.getElementById("card_plugin").style.display = "block";
		document.getElementById("card_pluginstep").style.display = "none";
	},
	onPluginStepClick: async function (step) {
		console.log("PRT.onPluginStepClick", step);
		PluginRegistrationTool.lastSelectedPluginStep_ID = step["sdkmessageprocessingstepid"];
		document.getElementById("card_assembly").style.display = "none";
		document.getElementById("card_plugin").style.display = "none";
		document.getElementById("card_pluginstep").style.display = "block";


		//console.log("onPluginStepClick", step);
		document.getElementById("pluginstepname").innerHTML = step.name;
		document.getElementById("pluginstepmessage").value = step["_sdkmessageid_value@OData.Community.Display.V1.FormattedValue"];
		document.getElementById("pluginstepfilteringattributes").value = step["filteringattributes"];
		document.getElementById("pluginstepstatecode").value = step["statecode"];


		let primaryEntity = "";
		const _sdkmessagefilterid_value = step["_sdkmessagefilterid_value"];
		if (_sdkmessagefilterid_value) {
			const sdkMessageFilterEntity = this.WebApi.Retrieve("sdkmessagefilter", _sdkmessagefilterid_value, ["primaryobjecttypecode"]);
			primaryEntity = sdkMessageFilterEntity["primaryobjecttypecode"]
			document.getElementById("pluginstepprimaryentity").value = primaryEntity;

		}
		document.getElementById("pluginsteprank").value = step.rank;

		//
		//
		//



		//alert("PLUGIN TRACE LOG STUFF");



		const top = 5;
		let filter = "$filter=";
		filter += (filter !== "$filter=" ? " and " : "") + `primaryentity eq '${primaryEntity}'`;
		filter += (filter !== "$filter=" ? " and " : "") + `messagename eq '${step["_sdkmessageid_value@OData.Community.Display.V1.FormattedValue"]}'`;
		const typename = step.name.match(/^[^:]+/)[0]; // Matches everything before the first ":"
		filter += (filter !== "$filter=" ? " and " : "") + `startswith(typename,'${typename}')`;
		filter = filter === "$filter=" ? "" : filter + "&";
		const plugintraces = await PluginRegistrationTool.WebApi.RetrieveWithCustomFilter(
			`plugintracelogs?${filter}$top=${top}&$orderby=performanceconstructorstarttime desc`
		);

		PluginRegistrationTool.renderPluginLogs(plugintraces.value, step.name);

		console.log("plugintraces", plugintraces)

	},

	//CRUD
	Retrieve_pluginassemblies: async () => {
		try {

			PluginRegistrationTool.toggleOverlay(true);
			let filter = document.getElementById("filterassemblies").value;
			let filter2 = "";
			if (filter) {
				filter2 = `&$filter=contains(assemblyname,'${filter}')`;

				filter = `&$filter=contains(name,'${filter}')`;

			} else {
				filter = "";
			}
			//alert(filter)

			PluginRegistrationTool.pluginassemblies_cached = await PluginRegistrationTool.WebApi.RetrieveWithCustomFilter(`pluginassemblies?$select=name&$orderby=name asc${filter}`);
			PluginRegistrationTool.plugintypes_cached = await PluginRegistrationTool.WebApi.RetrieveWithCustomFilter(`plugintypes?$select=assemblyname,_pluginassemblyid_value,typename,friendlyname&$orderby=assemblyname asc${filter2}`);
			console.log("plugintypes", PluginRegistrationTool.plugintypes_cached)
			// Group plugintypes by pluginassemblyid
			const groupedData = PluginRegistrationTool.pluginassemblies_cached.value.map(assembly => {
				const types = PluginRegistrationTool.plugintypes_cached.value.filter(type => type._pluginassemblyid_value === assembly.pluginassemblyid)
					.sort((a, b) => a.typename.localeCompare(b.typename)); // Sort alphabetically by typename
				return {
					assemblyName: assembly.name,
					pluginassemblyid: assembly.pluginassemblyid,
					plugintypes: types
				};
			});

			//// Generate HTML for the tree view
			//let treeViewHtml = '<div id="my-tree-view" class="tree-view">';
			//groupedData.forEach(assembly => {
			//	treeViewHtml += `
			//                    <div class="branch-node">


			//        <div data-id="${assembly.pluginassemblyid}" class="branch-title" onclick="PluginRegistrationTool.onAssemblyClick(${JSON.stringify(assembly).replace(/"/g, '&quot;')})">(Assembly) ${assembly.assemblyName}</div>
			//                        <ul class="branches">`;

			//	assembly.plugintypes.forEach(type => {
			//		treeViewHtml += `
			//                        <div class="branch-node">
			//            <div class="branch-title" onclick="PluginRegistrationTool.onPluginClick(${JSON.stringify(type).replace(/"/g, '&quot;')})">${type.typename}</div>
			//                        </div>`;
			//	});

			//	treeViewHtml += '</ul></div>';
			//});
			//treeViewHtml += '</div>';

			// Generate HTML for the tree view
			let treeViewHtml = '<div id="my-tree-view" class="tree-view">';
			groupedData.forEach(assembly => {
				treeViewHtml += `
        <div class="branch-node">
            <div data-id="${assembly.pluginassemblyid}" class="branch-title" onclick="PluginRegistrationTool.onAssemblyClick(${JSON.stringify(assembly).replace(/"/g, '&quot;')})">
                <img src="data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAK3RFWHRDcmVhdGlvbiBUaW1lAE1pIDMwIEp1bCAyMDAzIDE5OjE2OjExICswMTAwXpRAtgAAAAd0SU1FB9MIDwkzFj8DdFgAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAEZ0FNQQAAsY8L/GEFAAACn0lEQVR42qVTTUgUYRh+5mdnf9xcGt38l6SEDUwW+iGkIiq8BEl0kDQCKQ9BJZ2iLt6CDEMSgjq4l6DyJCToocBDJpGgZXowTFk1bFl3dWbW2Z3f3hlh+r35Hr75vne+93me9+cDdmiMs7xNICBqiGlAjGcQG5rYFT8T3yqrFP01LCtUKKqanvpqjtsGO9iwVxs5ehObfwB8HgjNi6WxeoFjsfhDwNgnBT0vZZxoDGBhRcPZQwHsr7RQWyIhWiRpmbQ8pqvoa3mAEd4BYDl/ddW+Jpy79RFtzSJOxf24caESIT8wPiNj8F0Btq8ITUeiyGbXhHCEb56eyh6m0BIXwLZNBrlVVES20N5SDwQbISvfsZqeRVVtHl3nF3HvqYpjVVkUdICjKNMA68RuK2AYC7YJmzIy1+dhBC0sfHkBTUrBsgEfR7kyUVgWYJhwfWQhD2Au6QP8afC8o8aAqSlEE4RJF01zu1A27XVit61fPpfcWRr2msazYQWziyp4gW5aMrFxMAzaOpfJxXM2dDp/mA/hyWgpqN6GB0DSzJ7OYtSV+3D1/jLplCGQboH+rkscXo0XY/pbEH3DUeRUBpePZxx1mpdCQdNGNqRMWyQMdF3cjdbuJVSU6kiu7EG5aOL0AQmpTR4dJzPI5bfTcLLyAHzIJbbUzCWOEZmyiInnd0swMbeMIiMFTXcVEglL7HC7oNJXM/DaS+FgJ95AX3vIQbazigGdehQJaC6bWoAbyBChUzynkPk8HVT0ewCO1bXjTrwm1Z9cSlI3na7qbuWdahd0Fj7WgizDVmVMhnhcuTaASW+Uf7fRbvSK5dW3DVthNtY3IEmAtAmFRqEnHMBQ62PM/POY/rbEdTziBLZLlq33NDSJsIjBjl4oO325/7WfnewsTmlFy5UAAAAASUVORK5CYII=" alt="Assembly Image" class="branch-image"> <!-- Add your image here -->
                (Assembly) ${assembly.assemblyName}
            </div>
            <ul class="branches">`;

				assembly.plugintypes.forEach(type => {
					treeViewHtml += `
            <div class="branch-node">
                <div class="branch-title" onclick="PluginRegistrationTool.onPluginClick(${JSON.stringify(type).replace(/"/g, '&quot;')})">
                    <img src="data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAHJSURBVDhPtVLPK0RRFH6EjQXFP6CsZEEpKXZ+RxbTMMM89415hpDfGZn33rXSzL0jOxqRPSvlf8CCnVjJTjaUkjJ4znnvvJkhZOOrr8473/nOuffcp/wbmCmnNUOkXcoYpf8OZsgzzZS2S3FN6Z8xwmWtZknm57wkzGUNTH7INjDks2qk6jnnRdA4EDZlI9k82AUw5dgtFnfMEJmBOcvuG1twiDEY36DRLdVcRqPpYjIrCk72pjFT2L36TKZtULfz2ROZzqDm1X3aCyxs1RN8k7GsqXVQP0V6376p5bwGIk12F8ySKgod6viLYw5GdkhSWoP6LuY6Q+MvWAMnWSIphwhfr0YRCt9pYoQkBWPKvWFNOJ5qJslFlKcqoesBil1swrk/nOCsLaRXIZ0Yct3aZAZr4PhH6vJaBdlhiaY4dATgwBx37vsdA/NWbgem3CM7Nki25Al2/6xpt4dGcy8xNPrqn4nnmcUr46KO7C7gWfbhNR6Bm/AfXAzHk3ZwcdUhiyfQdA412/A/PMEVtsiWQzSWKGN8oxxj/ONg0r03EfZzA7lCpw72FVqQpRj/CjjJVbaBIU4o/XeopmjSLOFHjqwkGyj9BYryAUF3Oq+fJM0xAAAAAElFTkSuQmCC" alt="Plugin Image" class="branch-image"> <!-- Add your image here -->
                    (Plugin) ${type.typename}
                </div>
            </div>`;
				});

				treeViewHtml += '</ul></div>';
			});
			treeViewHtml += '</div>';


			const container = document.getElementById("tree-view-container");
			if (container) {
				container.innerHTML = treeViewHtml;
			} else {
				console.error("Container for tree view not found!");
			}

			// Initialize tree view functionality
			const myTreeView = document.getElementById("my-tree-view");
			if (myTreeView) {
				await PluginRegistrationTool.treeView(myTreeView);
			} else {
				console.error("Tree view element not found!");
			}
			PluginRegistrationTool.toggleOverlay(false);

		} catch (error) {
			PluginRegistrationTool.toggleOverlay(false);

			console.error("Error in Retrieve_pluginassemblies:", error);
		}
	},
	create_plugin_async: async function () {

		if (!PluginRegistrationTool.lastSelectedAssembly_ID) {
			alert("select assembly first");
			return;
		}

		const newPluginName = document.getElementById("newnewpluginname").value;
		if (!newPluginName) {
			alert("please enter a plugin name");
			return;
		}

		const result = PluginRegistrationTool.pluginassemblies_cached.value.find(item => item.pluginassemblyid === PluginRegistrationTool.lastSelectedAssembly_ID);
		const name = result.name;
		if (newPluginName == name || newPluginName == `${name}.`) {
			alert("please complete the plugin name");
			return;
		}

		const plugintype = {};
		plugintype.name = newPluginName;
		plugintype.typename = newPluginName;
		plugintype.friendlyname = PluginRegistrationTool.generateGUID();
		plugintype["pluginassemblyid@odata.bind"] = "/pluginassemblies(" + PluginRegistrationTool.lastSelectedAssembly_ID + ")";

		try {
			PluginRegistrationTool.toggleOverlay(true);
			await PluginRegistrationTool.WebApi.CreateAsync("plugintype", plugintype);
			PluginRegistrationTool.toggleOverlay(false);
		} catch (e) {
			alert(e.error.message);
			PluginRegistrationTool.toggleOverlay(false);
		}
	//	document.getElementById("close_modal_createplugin").click();
	},
	UpdatePluginStep: async function () {

		let pluginsteprank = document.getElementById("pluginsteprank").value;
		pluginsteprank = parseFloat(pluginsteprank);  // Try to convert to number

		const pluginstepfilteringattributes = document.getElementById("pluginstepfilteringattributes").value;

		const pluginstepstatecode = document.getElementById("pluginstepstatecode").value;
		
		// Check if the conversion is valid
		if (!isNaN(pluginsteprank)) {

			PluginRegistrationTool.toggleOverlay(true);
			await PluginRegistrationTool.WebApi.UpdateAsync(
				`sdkmessageprocessingsteps(${PluginRegistrationTool.lastSelectedPluginStep_ID})`,
				{
					"rank": pluginsteprank,
					"filteringattributes": pluginstepfilteringattributes,
					"statecode": pluginstepstatecode
				}

			);
			PluginRegistrationTool.toggleOverlay(false);
		} else {
			alert("Error: pluginsteprank is not a valid number.");

		}
	},
	delete_plugin_async: async function () {
		try {

			PluginRegistrationTool.toggleOverlay(true);
			await PluginRegistrationTool.WebApi.DeleteAsync("plugintype", PluginRegistrationTool.lastSelectedPluginType_ID.plugintypeid);
			PluginRegistrationTool.toggleOverlay(false);

		} catch (e) {
			alert(e.error.message);
		}
	},
	update_pluginassembly_async: async function (file) {

		const reader = new FileReader();

		reader.onload = async function (e) {
			const base64String = e.target.result.split(',')[1]; // Extract Base64 part
			console.log("Base64 DLL File:", base64String); // Log the Base64 string

			PluginRegistrationTool.toggleOverlay(true);
			await PluginRegistrationTool.WebApi.UpdateAsync(
				`pluginassemblies(${PluginRegistrationTool.lastSelectedAssembly_ID})`,
				{ "content": base64String }
			);
			PluginRegistrationTool.toggleOverlay(false);
		};

		// Define the onerror event for the FileReader
		reader.onerror = function (error) {
			console.error("Error reading file:", error);
		};

		// Read the file as a Data URL (Base64)
		reader.readAsDataURL(file);

	},

	//Helpers
	generateGUID: function () {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = Math.random() * 16 | 0,
				v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	},
	hasClass: (element, className) => element.classList.contains(className),

	//UI
	closeModal_CreatePlugin: function () {
		const modal_Create_Plugin = document.getElementById('modal_createplugin');
		modal_Create_Plugin.style.visibility = 'hidden';
		modal_Create_Plugin.classList.remove('show');
	},
	renderPluginLogs: (data, stepname) => {
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


		//

		document.getElementById("ID_PLUGINLOGS_TITLE").innerHTML = `Plugin Trace Viewer: ${stepname} : ${data.length}`;



	},
	toggleOverlay: (show) => {
		document.getElementById('overlay').style.display = show ? 'block' : 'none';
	},
	openModal_CreatePlugin: function () {
		const modal_Create_Plugin = document.getElementById('modal_createplugin');
		if (!PluginRegistrationTool.lastSelectedAssembly_ID) {
			alert("select assembly first");
			return;
		}
		modal_Create_Plugin.style.visibility = 'visible';
		modal_Create_Plugin.classList.add('show');

		console.clear();
		console.log("registerplugin", PluginRegistrationTool.pluginassemblies_cached);

		const result = PluginRegistrationTool.pluginassemblies_cached.value.find(item => item.pluginassemblyid === PluginRegistrationTool.lastSelectedAssembly_ID);
		const name = result ? result.name : null; // Returns name if found, else null
		if (name) {
			document.getElementById("assemblyID_TEST").textContent = name;
			document.getElementById("newnewpluginname").value = `${name}.`;
			document.getElementById("newnewpluginname").focus();
		}
	},
	removeSelectedElements: function () {
		// Select all elements with the 'selected' class
		const selectedElements = document.querySelectorAll('.branch-title.selected');

		// Loop through the NodeList and remove the 'selected' class from each element
		selectedElements.forEach(element => {
			element.classList.remove('selected');
		});

	},
	ManageDropdowns: function () {
		const dropdown = document.getElementById('dropdown1');
		const toggleButton = document.getElementById('toggleButton');

		// Toggle dropdown visibility on button click
		toggleButton.addEventListener('click', function (event) {


			event.stopPropagation(); // Prevent event from bubbling to document
			if (dropdown.style.display === 'block') {
				dropdown.style.display = 'none';
			} else {
				dropdown.style.display = 'block';
			}
		});

		// Close dropdown when clicking anywhere else on the page
		document.addEventListener('click', function () {
			dropdown.style.display = 'none';
		});
	},

	//BUTTONS
	addButtonEvents: function () {

		document.getElementById('updatepluginstep').addEventListener('click', async function (e) {
			e.preventDefault();
			await PluginRegistrationTool.UpdatePluginStep();
		});

		document.getElementById('refreshplugins').addEventListener('click', async function (e) {
			e.preventDefault();
			await PluginRegistrationTool.Retrieve_pluginassemblies();
		});
		

		// Get the input element
		const filterInput = document.getElementById('filterassemblies');

		// Listen for input changes
		filterInput.addEventListener('input', function () {
			// Save the value of the input to local storage
			localStorage.setItem('filterAssemblies', filterInput.value);
		});


		const savedValue = localStorage.getItem('filterAssemblies');
		if (savedValue) {
			filterInput.value = savedValue;  // Set the input value
		}


		return;
		////Close model [Close]
		//document.getElementById('close_modal_createplugin').addEventListener('click', function () {
		//	PluginRegistrationTool.closeModal_CreatePlugin();
		//});

		//Close model [X]
		document.getElementById('closemodal').addEventListener('click', function () {
			PluginRegistrationTool.closeModal_CreatePlugin();

		});

		//Open modal [Register New Plugin]
		document.getElementById('registerplugin').addEventListener('click', function (e) {
			e.preventDefault();
			PluginRegistrationTool.openModal_CreatePlugin();
		});

		//Create plugin
		document.getElementById('save_modal_createplugin').addEventListener('click', async function (e) {
			e.preventDefault();
			await PluginRegistrationTool.create_plugin_async();
		});

		//Unregister plugin
		document.getElementById('unregisterplugintype').addEventListener('click', async function () {
			await PluginRegistrationTool.delete_plugin_async();
		});

		//File upload: assembly
		document.getElementById('assembly-upload').addEventListener('change', async function (event) {

			const file = event.target.files[0]; // Get the first selected file
			if (file) {
				await PluginRegistrationTool.update_pluginassembly_async(file);
			} else {
				console.log("No file selected.");
			}
		});

		

	}
};

PluginRegistrationTool.ManageDropdowns();
PluginRegistrationTool.addButtonEvents();
PluginRegistrationTool.Retrieve_pluginassemblies();
