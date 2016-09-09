/*
 * Privee is released under the BSD 3-Clause License.
 * Copyright (c) 2014, Sebastian Zimmeck and Steven M. Bellovin
 * All rights reserved.
 * 
 * trainer.js trains the ML classifier
 * this is the multinomial naive Bayes version (commented out below is also the Bernoulli naive Bayes version; 
 * to use it, completely comment out the current multinomial naive Bayes code and change classifier.js as well)
 */

chrome.extension.onMessage.addListener(function(request, sender) {
	
	if (request.action == "checkForTraining") {

		if (localStorage.trainingDone === undefined) {
			// set the number of training policies contained in trainingData.js (100 training policies) and the first policy (policy 1) to process
			sessionStorage.setItem("TDSIZE", 100);
			sessionStorage.setItem("currTrainDocNo", 1);
			sessionStorage.setItem("trainPhrases", "start");
			
			// set up classes and complement classes
			localStorage.setItem("CSIZE", 6);
			localStorage.setItem("classes", "#Collection #Profiling #ThirdPartyTracking #Disclosure #LimitedRetention #Encryption");
			localStorage.setItem("complementClasses", "#NoCollection #NoProfiling #NoThirdPartyTracking #NoDisclosure #NoLimitedRetention #NoEncryption");
	
			var classes = localStorage.getItem("classes").split(" ");
			var complementClasses = localStorage.getItem("complementClasses").split(" ");
			var CLASSIFICATION_SIZE = localStorage.getItem("CSIZE");
			
			// set up storage
			for (var j=0; j<CLASSIFICATION_SIZE; j++) {
				// counters for how many times a document is assigned a certain class / complement class, for prior probabilities
				sessionStorage.setItem("classCounter"+j, 0);
				sessionStorage.setItem("complementClassCounter"+j, 0);
				// storage for the vocabularies and their sizes in classes and complement classes
				sessionStorage.setItem("vocabulary"+j, "");
				localStorage.setItem("vocabularySize"+j, 0);
				// counters for words in classes and complement classes
				localStorage.setItem(classes[j], 0);
				localStorage.setItem(complementClasses[j], 0);
			}
			
			// announce to the user that training is required
			labelGrade.innerText = "On this first run of the automatic classifiers Privee needs to take one minute to analyze training data. Please wait.";
			
			chrome.extension.sendMessage({
		   		action: "trainingRequired",
		   	});
		}
		
		else {
			chrome.extension.sendMessage({
				action: "trainingDone",
			});
		}
	}
  
	if (request.action == "train") {
		chrome.extension.sendMessage({
   			action: "requestTrainingSections",
   		});
	}
  
	if (request.action == "forwardTrainingSections") {
		
		train();
		
		// if not yet all training documents processed, continue training
		if (parseInt(sessionStorage.getItem("currTrainDocNo")) != parseInt(sessionStorage.getItem("TDSIZE"))) {
			// increment counter to keep track of how many training policies have been processed
			temp = parseInt(sessionStorage.getItem("currTrainDocNo")) + 1;
			sessionStorage.setItem("currTrainDocNo", temp);
			chrome.extension.sendMessage({
				action: "trainingRequired",
			});
		}
		
		// if all training documents have been processed, get probabilities
		if (parseInt(sessionStorage.getItem("currTrainDocNo")) == parseInt(sessionStorage.getItem("TDSIZE"))) {
			probabilities();
			localStorage.trainingDone = "yes";
			chrome.extension.sendMessage({
				action: "trainingDone",
			});
		}
	}
});


// train on the training privacy policies
function train() {
	
	var classes = localStorage.getItem("classes").split(" ");
	var complementClasses = localStorage.getItem("complementClasses").split(" ");
	var CLASSIFICATION_SIZE = localStorage.getItem("CSIZE");
	var TRAINING_DATA_SIZE = sessionStorage.getItem("TDSIZE");
	var temp = 0;
	var reg = new RegExp(/\b\S+\b/g);
	
	// for each privacy policy iterate over all classifications
	for (var j=0; j<CLASSIFICATION_SIZE; j++) {
		
		// leave the current iteration of the loop if the current training section is already classified by the rule classifier
		if ((sessionStorage.getItem("trainingSection"+j) == "class") || (sessionStorage.getItem("trainingSection"+j) == "complementClass")) {
			continue;
		}
		
		// j+word is count of a word for a class (count(w|c)), format is as follows: key: [class][word]; value: [word count]
		var word = "";
		while((word = reg.exec(sessionStorage.getItem("trainingSection"+j))) !== null) {
			// word count for class
			if (sessionStorage.getItem("CLASS").match(classes[j])) {
				
		    	if (sessionStorage.getItem(j+word) === null) {
		    		// count (add-1) smoothing and first word
		    		sessionStorage.setItem(j+word, 2);
		    	}
		    	
		    	else {
		    		temp = parseInt(sessionStorage.getItem(j+word)) + 1;
					sessionStorage.setItem(j+word, temp);
		    	}
		    }
		    // word count for complement class
		   	else {
		   		
		    	if (sessionStorage.getItem("c"+j+word) === null) {
		    		// count (add-1) smoothing and first word
		    		sessionStorage.setItem("c"+j+word, 2);
		    	}
		    	
		    	else {
		    		temp = parseInt(sessionStorage.getItem("c"+j+word)) + 1;
					sessionStorage.setItem("c"+j+word, temp);
		    	}
		    }
		}
		
		// counter counts all words in a class/complement class including duplicates (count(c))
		var counter = sessionStorage.getItem("trainingSection"+j).match(reg).length;
		if (sessionStorage.getItem("CLASS").match(classes[j])) {
			// add word count to class counter
			temp = parseInt(localStorage.getItem(classes[j])) + counter;
			localStorage.setItem(classes[j], temp);
			// add 1 to class counter (to calculate prior probability)
			temp = parseInt(sessionStorage.getItem("classCounter"+j)) + 1;
			sessionStorage.setItem("classCounter"+j, temp);
		}
		
		else {
			// add word count to complement class counter
			temp = parseInt(localStorage.getItem(complementClasses[j])) + counter;
			localStorage.setItem(complementClasses[j], temp);
			// add 1 to complement class counter (to calculate prior probability)
			temp = parseInt(sessionStorage.getItem("complementClassCounter"+j)) + 1;
			sessionStorage.setItem("complementClassCounter"+j, temp);
		}
		
		// fill the vocabulary with unique words
		var tempList = sessionStorage.getItem("trainingSection"+j).split(" ").filter(function(item,i,allItems){
			return i==allItems.indexOf(item);
		}).join(" ");
		
		while((word = reg.exec(tempList)) !== null) {
			// if the word is not yet contained in the vocabulary, include it
			if ((sessionStorage.getItem("vocabulary"+j).search(word)) == -1) {
				temp = sessionStorage.getItem("vocabulary"+j) + word + " ";
				sessionStorage.setItem("vocabulary"+j, temp);
			}
		}	
	}
};


// get probabilities
function probabilities() {
	
	var classes = localStorage.getItem("classes").split(" ");
	var complementClasses = localStorage.getItem("complementClasses").split(" ");
	var CLASSIFICATION_SIZE = localStorage.getItem("CSIZE");
	var TRAINING_DATA_SIZE = sessionStorage.getItem("TDSIZE");
	var temp = 0;
	
	for (var j=0; j<CLASSIFICATION_SIZE; j++) {
		
		// count the words in the vocabulary
		// vocabulary size (|V|) of classes and complement classes excluding duplicates
		// length returns 1 + integer key, therefore need to subtract 1
		temp = sessionStorage.getItem("vocabulary"+j).split(" ").length - 1;
		localStorage.setItem("vocabularySize"+j, temp);
		
		// prior probability of a class (P(c)) is the number of documents with that class (N_c) divided by the total number of documents (N)
		// (that is, P(c) =  N_c / N)
		localStorage.setItem("priorClassProb"+j, (parseInt(sessionStorage.getItem("classCounter"+j))/TRAINING_DATA_SIZE));
		localStorage.setItem("priorComplClassProb"+j, (parseInt(sessionStorage.getItem("complementClassCounter"+j))/TRAINING_DATA_SIZE));
		
	}
	
	// likelihood of a word given a class (P(w|c)) is the count of the word for that class (count(w,c)) divided by the count of all words in that class (count(c))
	// (that is, P(w|c) = count(w,c) + 1 / count(c) + |V|)
	// for smoothing 1 is added to the numerator and the vocabulary size (|V|) is added to the denominator
	for (var k=0; k<sessionStorage.length; k++) {
		
		// match the beginning of key for word storage
		for (var j=0; j<CLASSIFICATION_SIZE; j++) {
			
			var reg2 = new RegExp(j);
			var reg3 = new RegExp("c"+j);
			
			// calculate likelihood for a class
			if (sessionStorage.key(k).match(reg2) ) {	
	    		localStorage.setItem("P" + sessionStorage.key(k), (parseInt(sessionStorage.getItem(sessionStorage.key(k)))/
	    		(parseInt(localStorage.getItem(classes[j])) + parseInt(localStorage.getItem("vocabularySize"+j)))));
	    	}
	    	// calculate likelihood for a complement class
	 	   	if (sessionStorage.key(k).match(reg3) ) {
	    		localStorage.setItem("P" + sessionStorage.key(k), (parseInt(sessionStorage.getItem(sessionStorage.key(k)))/
	    		(parseInt(localStorage.getItem(complementClasses[j])) + parseInt(localStorage.getItem("vocabularySize"+j)))));
	    	}
		}
	}
};


/*
// Bernoulli naive Bayes version
chrome.extension.onMessage.addListener(function(request, sender) {
	
	if (request.action == "checkForTraining") {

		if (localStorage.trainingDone === undefined) {
			
			// set the number of training documents
			sessionStorage.setItem("TDSIZE", 100);
			sessionStorage.setItem("currTrainDocNo", 1);
			
			sessionStorage.setItem("trainPhrases", "start");
			
			// set up number of classes and complement classes
			localStorage.setItem("CSIZE", 6);
			
			// set up classes and complement classes
			localStorage.setItem("classes", "#Collection #Profiling #ThirdPartyTracking #Disclosure #LimitedRetention #Encryption");
			localStorage.setItem("complementClasses", "#NoCollection #NoProfiling #NoThirdPartyTracking #NoDisclosure #NoLimitedRetention #NoEncryption");
	
			var classes = localStorage.getItem("classes").split(" ");
			var complementClasses = localStorage.getItem("complementClasses").split(" ");
			var CLASSIFICATION_SIZE = localStorage.getItem("CSIZE");
			
			// set up storage
			for (var j=0; j<CLASSIFICATION_SIZE; j++) {
				
				// counters for how many times a document is assigned a certain class / complement class, for prior probabilities
				sessionStorage.setItem("classCounter"+j, 0);
				sessionStorage.setItem("complementClassCounter"+j, 0);
				// storage for the vocabularies and their sizes in classes and complement classes
				sessionStorage.setItem("vocabulary"+j, "");
				localStorage.setItem("vocabularySize"+j, 0);
				// counters for words in classes and complement classes
				localStorage.setItem(classes[j], 0);
				localStorage.setItem(complementClasses[j], 0);
			}
			
			// announce to the user that training is required
			labelGrade.innerText = "On this first run of the automatic classifiers Privee needs to take one minute to analyze training data. Please wait.";
			
			chrome.extension.sendMessage({
		   		action: "trainingRequired",
		   	});
		}
		
		else {
			chrome.extension.sendMessage({
				action: "trainingDone",
			});
		}
	}
  
	if (request.action == "train") {
		chrome.extension.sendMessage({
   			action: "requestTrainingSections",
   		});
	}
  
	if (request.action == "forwardTrainingSections") {
		
		train();
		
		// if not yet all training documents processed, continue training
		if (parseInt(sessionStorage.getItem("currTrainDocNo")) != parseInt(sessionStorage.getItem("TDSIZE"))) {
			// increment counter to keep track of how many training policies have been processed
			temp = parseInt(sessionStorage.getItem("currTrainDocNo")) + 1;
			sessionStorage.setItem("currTrainDocNo", temp);
			chrome.extension.sendMessage({
				action: "trainingRequired",
			});
		}
		
		// if all training documents processed, get probabilities
		if (parseInt(sessionStorage.getItem("currTrainDocNo")) == parseInt(sessionStorage.getItem("TDSIZE"))) {
			probabilities();
			localStorage.trainingDone = "yes";
			chrome.extension.sendMessage({
				action: "trainingDone",
			});
		}
	}
});


// train on the training privacy policies
function train() {
	
	var classes = localStorage.getItem("classes").split(" ");
	var complementClasses = localStorage.getItem("complementClasses").split(" ");
	var CLASSIFICATION_SIZE = localStorage.getItem("CSIZE");
	var TRAINING_DATA_SIZE = sessionStorage.getItem("TDSIZE");
	var reg = new RegExp(/\b\S+\b/g);
	var temp = 0;
	var tempArray = new Array();
	var tempWordsClass = "";
	var tempWordsComplementClass = "";
	
	// for each privacy policy iterates over all classifications
	for (var j=0; j<CLASSIFICATION_SIZE; j++) {
		
		// leave the current iteration of the loop if the current training document has already a rule classification
		if ((sessionStorage.getItem("trainingSection"+j) == "class") || (sessionStorage.getItem("trainingSection"+j) == "complementClass")) {
			continue;
		}
		
		// count of how many documents in a class/complement class contain a particular word (count(w,c))
		var word = "";
		while ((word = reg.exec(sessionStorage.getItem("trainingSection"+j))) !== null) {
			
			// count (add-1) smoothing
			if (sessionStorage.getItem("c"+j+word) === null) {
		    	sessionStorage.setItem("c"+j+word, 1);
		    }
		    if (sessionStorage.getItem("co"+j+word) === null) {
		    	sessionStorage.setItem("co"+j+word, 1);
		    }
			
			// count for class
			if (sessionStorage.getItem("CLASS").match(classes[j])) {
		    	
	    		tempArray = tempWordsClass.split(" ");
	    		for (var k=0; k<tempArray.length; k++) {
	    			if (tempArray[k].match(word)) {
	    				temp = 1;
	    				break;
	    			}
	    		}
	    		if (temp != 1) {
	    			temp = parseInt(sessionStorage.getItem("c"+j+word)) + 1;
					sessionStorage.setItem("c"+j+word, temp);
					tempWordsClass += word + " ";
	    		}
	    		temp = 0;
		    	
		    }
		    
		    // count for complement class
		    if (sessionStorage.getItem("CLASS").match(complementClasses[j])) {
		    	
	    		tempArray = tempWordsComplementClass.split(" ");
	    		for (var k=0; k<tempArray.length; k++) {
	    			if (tempArray[k].match(word)) {
	    				temp = 1;
	    				break;
	    			}
	    		}
	    		if (temp != 1) {
	    			temp = parseInt(sessionStorage.getItem("co"+j+word)) + 1;
					sessionStorage.setItem("co"+j+word, temp);
					tempWordsComplementClass += word + " ";
	    		}
		    }
		}
		
		// count of documents in a class and its complement class (count(c))
		if (sessionStorage.getItem("CLASS").match(classes[j])) {
			
			// add 1 to class counter (also to calculate prior probability)
			temp = parseInt(sessionStorage.getItem("classCounter"+j)) + 1;
			sessionStorage.setItem("classCounter"+j, temp);
		}
		
		else {
			
			// add 1 to complement class counter (qlso to calculate prior probability)
			temp = parseInt(sessionStorage.getItem("complementClassCounter"+j)) + 1;
			sessionStorage.setItem("complementClassCounter"+j, temp);
		}
	}
};


// get probabilities
function probabilities() {
	
	var classes = localStorage.getItem("classes").split(" ");
	var complementClasses = localStorage.getItem("complementClasses").split(" ");
	var CLASSIFICATION_SIZE = localStorage.getItem("CSIZE");
	var TRAINING_DATA_SIZE = sessionStorage.getItem("TDSIZE");
	var temp = 0;
	
	for (var j=0; j<CLASSIFICATION_SIZE; j++) {
		
		// constant for the two possibilities of each term; ocurrence and nonoccurence (C)
		localStorage.setItem("vocabularySize"+j, 2);
		
		// prior probability of a class, P(c), is the number of documents with that class, count(c), divided by the total number of documents, N,
		// that is, P(c) =  count(c) / N
		localStorage.setItem("priorClassProb"+j, (parseInt(sessionStorage.getItem("classCounter"+j))/TRAINING_DATA_SIZE));
		localStorage.setItem("priorComplClassProb"+j, (parseInt(sessionStorage.getItem("complementClassCounter"+j))/TRAINING_DATA_SIZE));
		
	}
	
	// likelihood of a word given a class, P(w|c), is the occurence of the word for that class, count(w,c), which includes one additional count for smoothing
	// divided by the count of all documents in that class, count(c), plus a constant, C = 2, for the two possibilities occurence and nonoccurence of a term 
	// in a class, that is, P(w|c) = count(w,c) / count(c) + C
	for (var k=0; k<sessionStorage.length; k++) {
		
		// match the beginning of key for word storage
		for (var j=0; j<CLASSIFICATION_SIZE; j++) {
			var reg2 = new RegExp("c"+j);
			var reg3 = new RegExp("co"+j);
			
			// calculate likelihood for a class
			if (sessionStorage.key(k).match(reg2)) {	
	    		localStorage.setItem("P" + sessionStorage.key(k), (parseInt(sessionStorage.getItem(sessionStorage.key(k)))/
	    		(parseInt(sessionStorage.getItem("classCounter"+j)) + parseInt(localStorage.getItem("vocabularySize"+j)))));
	    	}
	    	
	    	// calculate likelihood for a complement class
	 	   	if (sessionStorage.key(k).match(reg3)) {
	    		localStorage.setItem("P" + sessionStorage.key(k), (parseInt(sessionStorage.getItem(sessionStorage.key(k)))/
	    		(parseInt(sessionStorage.getItem("complementClassCounter"+j)) + parseInt(localStorage.getItem("vocabularySize"+j)))));
	    	}
		}
	}
};
*/