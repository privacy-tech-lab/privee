/*
 * Privee is released under the BSD 3-Clause License.
 * Copyright (c) 2014, Sebastian Zimmeck and Steven M. Bellovin
 * All rights reserved.
 * 
 * background.js manages the different components of the privacy policy analysis
 */

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript(null, {
    file: "scraper.js"
  }, function() {
  });
});

chrome.extension.onMessage.addListener(function(request, sender) {

	if (request.action == "returnPrivacyPolicy") {
		var privacyPolicy = request.source;    
		chrome.extension.sendMessage({
		//action: "forwardLabels",
		action: "getSections",
		source: privacyPolicy
		});
	}
	
	if (request.action == "returnSections") {
		chrome.extension.sendMessage({
			action: "checkForTraining",
		});
	}
	
	if (request.action == "trainingRequired") {
		chrome.extension.sendMessage({
			action: "getTrainingData",
		});
	}
	
	if (request.action == "returnTrainingData") { 
		chrome.extension.sendMessage({
			action: "train",
		});
	}
	
	if (request.action == "requestTrainingSections") {
		chrome.extension.sendMessage({
			action: "getTrainingSections",
		});
	}
	
	if (request.action == "returnTrainingSections") { 
		var counter = request.source;
		chrome.extension.sendMessage({
			action: "forwardTrainingSections",
		});
	}
	
	if (request.action == "trainingDone") {
		chrome.extension.sendMessage({
			action: "getClassifications",
		});
	}
	
	if (request.action == "returnClassifications") {  
		var classifications = request.source;
		chrome.extension.sendMessage({
			action: "forwardClassifications",
			source: classifications
		});
	}
	
	if (request.action == "returnLabels") {   
		var classifications = request.source;
		chrome.extension.sendMessage({
			action: "forwardLabels",
			source: classifications
		});
	}
});