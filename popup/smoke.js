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
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see {http://www.gnu.org/licenses/}.

	Home: https://github.com/XrmWebTools
*/
// Get the checkbox element
const checkbox = document.getElementById('iamawizard');

// Add event listener for the checkbox to toggle cursor behavior
checkbox.addEventListener('change', function () {
	manageStyleTag();
});


document.addEventListener('DOMContentLoaded', function () {
	manageStyleTag();

});

function manageStyleTag() {
	const styleTag = document.getElementById('wand-cursor-style');

	if (checkbox?.checked) { // Ensure checkbox exists and is checked
		if (!styleTag) {
			const style = document.createElement('style');
			style.id = 'wand-cursor-style';
			style.innerHTML = `
            * {
                cursor: url("https://cdn.prod.website-files.com/621f541df60bb50feebe0c73/672b1d55ecfa86942f62f9cf_wand-cursor.png"), auto !important;
            }`;
			document.head.appendChild(style);
		}
	} else {
		if (styleTag) {
			document.head.removeChild(styleTag);
		}
	}
}


// Mousemove and mousedown events to create smoke particles
document.addEventListener('mousemove', (e) => {
	if (checkbox.checked) { // Only trigger smoke effect if checkbox is checked
		// Create a smoke particle element
		const smoke = document.createElement('div');
		smoke.classList.add('smoke');
		document.body.appendChild(smoke);

		// Position it at the cursor's location
		smoke.style.left = `${e.pageX}px`;
		smoke.style.top = `${e.pageY}px`;

		// Trigger animation and remove element after it completes
		smoke.addEventListener('animationend', () => { smoke.remove(); });
	}
});

document.addEventListener('mousedown', (e) => {
	if (checkbox.checked) { // Only trigger particles if checkbox is checked
		const particles = 50; // Number of particles per click

		for (let i = 0; i < particles; i++) {
			// Create a particle
			const particle = document.createElement('div');
			particle.classList.add('smoke');
			document.body.appendChild(particle);

			// Set initial position of the particle
			particle.style.left = `${e.pageX}px`;
			particle.style.top = `${e.pageY}px`;

			// Randomize particle movement direction and distance
			const angle = Math.random() * 2 * Math.PI;
			const distance = Math.random() * 80 + 20; // Random distance
			const xMove = Math.cos(angle) * distance;
			const yMove = Math.sin(angle) * distance;

			setTimeout(() => {
				particle.style.left = `${e.pageX + xMove}px`;
				particle.style.top = `${e.pageY + yMove}px`;
			}, 0);

			// Trigger animation and remove element after it completes
			particle.addEventListener('animationend', () => particle.remove());
		}
	}
});
