/*
 * Privee is released under the BSD 3-Clause License.
 * Copyright (c) 2014, Sebastian Zimmeck and Steven M. Bellovin
 * All rights reserved.
 * 
 * classifier.js contains the ML classifier
 * this is the multinomial naive Bayes version (commented out below is also the Bernoulli naive Bayes version; 
 * to use it, completely comment out the current multinomial naive Bayes code and change trainer.js as well)
 */

chrome.extension.onMessage.addListener(function(request, sender) {
	if (request.action == "getClassifications") {
		var classifications = classify();   
		chrome.extension.sendMessage({
			action: "returnClassifications",
			source: classifications
		});
  }
});


function classify() {
	
	var classes = localStorage.getItem("classes").split(" ");
	var complementClasses = localStorage.getItem("complementClasses").split(" ");
	var CLASSIFICATION_SIZE = localStorage.getItem("CSIZE");
	var classifications = new Array();
		
	// for each section, find whether it probably belongs to the class or the complement class
	for (var j=0; j<CLASSIFICATION_SIZE; j++) {
		
		// get the sections of the privacy policy and put it into an array
		var currentSection = sessionStorage.getItem("section"+j).split(" ");		
		
		// in some cases it was concluded by the rule classifier in preprocessor.js that the class / complement class is the right classification
		if (currentSection[0] == "class") {
			classifications[j] = classes[j];
		}
		
		if (currentSection[0] == "complementClass") {
			classifications[j] = complementClasses[j];
		}
		
		// otherwise, calculate proportianal probabilities of a document being in a class or complement class, that is, for each section compute
		// P(c|j) = Prior Probability * all word[k] probabilities
		if ((currentSection[0] != "class") && (currentSection[0] != "complementClass")) {
			
			// the prior probabilities have to be non-zero, this is achieved by assigning each class / complement class at least once in the training set
			// probability calculations are log probabilities
			var classProb = Math.log(parseFloat(localStorage.getItem("priorClassProb"+j)));
			var complClassProb = Math.log(parseFloat(localStorage.getItem("priorComplClassProb"+j)));
		
			for (var k=0; k<currentSection.length; k++) {
				// if probability for a word k in current section exists (truthy value), multiply it
				if (localStorage.getItem("P"+j+currentSection[k])) {
					// natural logarithm is used to avoid numbers getting to small
					classProb += Math.log(parseFloat(localStorage.getItem("P"+j+currentSection[k])));
				}
				// if a word not in the training set is encountered, set its probability with one smoothing divided by class size + vocabulary size
				else {
					classProb += Math.log(1 / (parseInt(localStorage.getItem(classes[j])) + parseInt(localStorage.getItem("vocabularySize"+j))));
				}
			}
			for (var k=0; k<currentSection.length; k++) {
				// if probability for a word exists, multiply it
				if (localStorage.getItem("Pc"+j+currentSection[k])) {
					// natural logarithm is used to avoid numbers getting to small
					complClassProb += Math.log(parseFloat(localStorage.getItem("Pc"+j+currentSection[k])));
				}
				// if a word not in the training set is encountered, set its probability with one smoothing divided by class size + vocabulary size
				else {
					complClassProb += Math.log(1 / (parseInt(localStorage.getItem(complementClasses[j])) + parseInt(localStorage.getItem("vocabularySize"+j))));
				}
				
			}
			
			
			// compare the probabilities and put the final classification into an array 
			if (classProb > complClassProb) {
				classifications[j] = classes[j];
			}
			
			else {
				classifications[j] = complementClasses[j];
			}			
		}
	}
	return classifications;
};


/*
// Bernoulli naive Bayes version
chrome.extension.onMessage.addListener(function(request, sender) {
	if (request.action == "getClassifications") {
		var classifications = classify();   
		chrome.extension.sendMessage({
			action: "returnClassifications",
			source: classifications
		});
  }
});


function classify() {
	
	var classes = localStorage.getItem("classes").split(" ");
	var complementClasses = localStorage.getItem("complementClasses").split(" ");
	var CLASSIFICATION_SIZE = localStorage.getItem("CSIZE");
	var classifications = new Array();
		
	// for each section, find whether it probably belongs to the class or the complement class
	for (var j=0; j<CLASSIFICATION_SIZE; j++) {
		
		// get the sections of the privacy policy and put it into an array
		var currentSection = sessionStorage.getItem("section"+j).split(" ");		
		
		// in some cases it was concluded by the rule classifier in preprocessor.js that the class / complement class is the right classification
		if (currentSection[0] == "class") {
			classifications[j] = classes[j];
		}
		
		if (currentSection[0] == "complementClass") {
			classifications[j] = complementClasses[j];
		}
		
		// otherwise, calculate proportianal probabilities of a document being in a class or complement class, that is, for each section compute
		// P(c|j) = Prior Probability * all word[k] probabilities
		if ((currentSection[0] != "class") && (currentSection[0] != "complementClass")) {
			
			// the prior probabilities have to be non-zero, this is achieved by assigning each class / complement class at least once in the training set
			// probability calculations are log probabilities
			var classProb = Math.log(parseFloat(localStorage.getItem("priorClassProb"+j)));
			var complClassProb = Math.log(parseFloat(localStorage.getItem("priorComplClassProb"+j)));
			var tempWordsClass = "";
			var tempWordsComplClass = "";
			
			// calculate class probability
			// loop iteration adjusted for spaces at the beginning and end of sections
			for (var k=1; k<currentSection.length-1; k++) {
				
				// if probability for a word k in current section exists (truthy value), multiply it
				if (!tempWordsClass.match("Pc"+j+currentSection[k])) {

					if (localStorage.getItem("Pc"+j+currentSection[k])) {
						// natural logarithm is used to avoid numbers getting to small
						classProb += Math.log(parseFloat(localStorage.getItem("Pc"+j+currentSection[k])));
					}
					
					tempWordsClass += "Pc"+j+currentSection[k] + " ";
				}
			}
			
			for (var k=0; k<localStorage.length; k++) {
					
				if (!tempWordsClass.match(localStorage.key(k))) {
					if (localStorage.key(k).match("c"+j)) {
						// natural logarithm is used to avoid numbers getting to small
						classProb += Math.log(1 - (parseFloat(localStorage.getItem(localStorage.key(k)))));
					}
				}
			}
			
			// calculate complement class probability
			// loop iteration adjusted for spaces at the beginning and end of sections
			for (var k=1; k<currentSection.length-1; k++) {
				
				// if probability for a word k in current section exists (truthy value), multiply it
				if (!tempWordsComplClass.match("Pco"+j+currentSection[k])) {
						
					if (localStorage.getItem("Pco"+j+currentSection[k])) {
						// natural logarithm is used to avoid numbers getting to small
						complClassProb += Math.log(parseFloat(localStorage.getItem("Pco"+j+currentSection[k])));
					}
					tempWordsComplClass += "Pco"+j+currentSection[k] + " ";
				}
			}
			
			for (var k=0; k<localStorage.length; k++) {
					
				if (!tempWordsComplClass.match(localStorage.key(k))) {
					
					if (localStorage.key(k).match("co"+j)) {
						// natural logarithm is used to avoid numbers getting to small
						complClassProb += Math.log(1 - (parseFloat(localStorage.getItem(localStorage.key(k)))));
					}
				}
			}
			
			// compare the probabilities and put the final classification into an array			
			if (classProb > complClassProb) {
				classifications[j] = classes[j];
			}
			else {
				classifications[j] = complementClasses[j];
			}
		}			
	}
	return classifications;
};
*/