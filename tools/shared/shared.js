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
const SHARED = {

	SWITCHER: {
		// Method to retrieve data with a custom filter
		DARKMODE: function () {

			(() => {
				let e = localStorage.getItem("theme"), t = () => e || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"), a = function (e) { "auto" === e && window.matchMedia("(prefers-color-scheme: dark)").matches ? document.documentElement.setAttribute("data-bs-theme", "light") : document.documentElement.setAttribute("data-bs-theme", e) }, r = function (e) {
					let t = document.getElementById("navbar"); t && ("light" === e || "auto" === e ? (// If navbar is currently dark, switch to light
						t.classList.remove("navbar-dark", "bg-transparent"), t.classList.add("navbar-light", "bg-transparent")) : (// If navbar is currently light, switch to dark
						t.classList.remove("navbar-light", "bg-transparent"), t.classList.add("navbar-dark", "bg-transparent")))
				}, s = function (e) {
					let t = document.getElementById("sidebar"); "light" === e || "auto" === e ? (// If navbar is currently dark, switch to light
						t.classList.remove("navbar-dark", "bg-transparent"), t.classList.add("navbar-light", "bg-transparent")) : (// If navbar is currently light, switch to dark
						t.classList.remove("navbar-light", "bg-transparent"), t.classList.add("navbar-dark", "bg-transparent"))
				}; a(t()); let n = e => {// const activeThemeIcon = document.querySelector('.theme-icon-active use')
					let t = document.querySelector(`[data-bs-theme-value="${e}"]`);// const svgOfActiveBtn = btnToActive.querySelector('svg use').getAttribute('href')
					document.querySelectorAll("[data-bs-theme-value]").forEach(e => { e.classList.remove("active") }), t.classList.add("active"),// activeThemeIcon.setAttribute('href', svgOfActiveBtn)
						r(e), s(e)
				}; window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { ("light" !== e || "dark" !== e) && a(t()) }), window.addEventListener("DOMContentLoaded", () => { n(t()), document.querySelectorAll("[data-bs-theme-value]").forEach(e => { e.addEventListener("click", () => { let t = e.getAttribute("data-bs-theme-value"); localStorage.setItem("theme", t), a(t), n(t) }) }) })
			})();//# sourceMappingURL=switcher.js.map


		},
	},

	TOPHEADER: {
		CONNECT: function () {
			console.log("connect");
			if (document.getElementById("connect")) {
				document.getElementById("connect").innerHTML = `Connected to: ${window.location.origin}`;
				// Add click event to open Google in a new tab
				document.getElementById("connect").addEventListener("click", function () {
					window.open(`${window.location.origin}/main.aspx?forceUCI=1&pagetype=apps`, "_blank");
				});
			}
			

		},

	},

	UI: {
		startpage: function () {
			
			if (document.getElementById("startpage")) {
				document.getElementById("startpage").addEventListener("click", function () {
					window.location.href = `${window.location.origin}/xrmwebtools`;
				});
			}
		},

		toggleDarkMode: function () {
			if (document.getElementById("toggledarkmode")) {
				document.getElementById("toggledarkmode").addEventListener("click", function () {
				
					var theme = localStorage.getItem("theme");
					if (!theme) {//if null it will be dark
						localStorage.setItem("theme", "light");
					} else {
						localStorage.setItem("theme", theme == "light" ? "dark" : "light");
					}
					SHARED.SWITCHER.DARKMODE();
				});
			}
		}
	}
}

SHARED.TOPHEADER.CONNECT();
SHARED.SWITCHER.DARKMODE();
SHARED.UI.startpage();
SHARED.UI.toggleDarkMode();

