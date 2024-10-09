
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

				$("#openxrmwebtools_today").click(function (e) {
					e.preventDefault();
					window.open(`${Xrm.Page.context.getClientUrl()}/xrmwebtools/today`, '_blank');
				});

				$("#openxrmwebtools_plugins").click(function (e) {
					e.preventDefault();
					window.open(`${Xrm.Page.context.getClientUrl()}/xrmwebtools/plugins`, '_blank');
				});

				$("#openxrmwebtools_solutions").click(function (e) {
					e.preventDefault();
					window.open(`${Xrm.Page.context.getClientUrl()}/xrmwebtools/solutions`, '_blank');
				});

				$("#openxrmwebtools_users").click(function (e) {
					e.preventDefault();
					window.open(`${Xrm.Page.context.getClientUrl()}/xrmwebtools/users`, '_blank');
				});






			}
		};

		//CrmPowerPane.UI.SetButtonBackgrounds();
		//CrmPowerPane.RegisterjQueryExtensions();
		CrmPowerPane.RegisterEvents2();




	});
} catch (e) {
	if (document.getElementById("rightBodyLinks")) {
		document.getElementById("rightBodyLinks").style.visibility = "hidden";
	}
}
