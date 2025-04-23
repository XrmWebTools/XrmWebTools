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
let headersEnabled = false;
let MSCRMCallerID = '';  // This will hold the dynamic MSCRMCallerID value.
let regexFilter = '.*';  // Default regex filter (matches all URLs).

chrome.storage.local.get(['headersEnabled', 'MSCRMCallerID', 'regexFilter'], (result) => {
    headersEnabled = result.headersEnabled || false;
    MSCRMCallerID = result.MSCRMCallerID || ''; // Set MSCRMCallerID if present
    regexFilter = result.regexFilter || '.*'; // Set regexFilter if present

    // Enable headers only if either headersEnabled or MSCRMCallerID has data
    if (headersEnabled || MSCRMCallerID) {
        enableHeaders();
    } else {
        disableHeaders();
    }
});

function enableHeaders() {
    const requestHeaders = [];

    // Always add mscrm.bypasscustompluginexecution if headersEnabled is true
    if (headersEnabled) {
        requestHeaders.push({
            header: 'mscrm.bypasscustompluginexecution',
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            value: 'true', // Set to true when headers are enabled
        });
    }

    // Only add MSCRMCallerID header if it has a value
    if (MSCRMCallerID) {
        requestHeaders.push({
            header: 'MSCRMCallerID',
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            value: MSCRMCallerID, // Dynamically set value for MSCRMCallerID
        });
    }

    const rules = {
        removeRuleIds: [1],
        addRules: [
            {
                id: 1,
                priority: 1,
                action: {
                    type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                    requestHeaders: requestHeaders,
                },
                condition: {
                    regexFilter: regexFilter, // Use dynamic regexFilter
                    resourceTypes: [
                        chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
                        chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
                        chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
                    ],
                },
            },
        ],
    };

    chrome.declarativeNetRequest.updateDynamicRules(rules, () => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
        } else {
            console.log('Headers enabled successfully');
        }
    });
}

function disableHeaders() {
    chrome.declarativeNetRequest.updateDynamicRules(
        {
            removeRuleIds: [1],
        },
        () => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            } else {
                console.log('Headers disabled successfully');
            }
        }
    );
}

chrome.storage.onChanged.addListener((changes) => {
    if (changes.headersEnabled) {
        headersEnabled = changes.headersEnabled.newValue;
        if (headersEnabled || MSCRMCallerID) {
            enableHeaders(); // Reapply headers if necessary
        } else {
            disableHeaders(); // Disable headers if neither condition is met
        }
    }
    if (changes.MSCRMCallerID) {
        MSCRMCallerID = changes.MSCRMCallerID.newValue;
        if (headersEnabled || MSCRMCallerID) {
            enableHeaders(); // Reapply headers if necessary
        } else {
            disableHeaders(); // Disable headers if neither condition is met
        }
    }
    if (changes.regexFilter) {
        regexFilter = changes.regexFilter.newValue;
        // When regexFilter changes, check again if headers should be enabled
        if (headersEnabled || MSCRMCallerID) {
            enableHeaders(); // Reapply headers if necessary
        } else {
            disableHeaders(); // Disable headers if neither condition is met
        }
    }
});
