/*
 * Privee is released under the BSD 3-Clause License.
 * Copyright (c) 2014, Sebastian Zimmeck and Steven M. Bellovin
 * All rights reserved.
 * 
 * scraper.js obtains the URL and body text of the current website
 */

function getURLAndText() {
   
	var privacyPolicy = document.URL + " " + document.getElementsByTagName("body")[0].innerText;
	return privacyPolicy;
}

chrome.extension.sendMessage({
    action: "returnPrivacyPolicy",
    source: getURLAndText(document)
});