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
setTimeout(() => { document.getElementById("XrmWebTools").style.display = "block" }, 50);
const searchInput = document.getElementById("search");
const toolItems = document.querySelectorAll(".list-group-item");
searchInput.addEventListener("input", function () {
	const searchTerm = searchInput.value.toLowerCase();
	toolItems.forEach(item => {
		const toolName = item.querySelector(".text-heading").textContent.toLowerCase();
		const isVisible = toolName.includes(searchTerm);
		item.style.display = isVisible ? "flex" : "none";
		item.classList.toggle("d-flex", isVisible);
	});
});