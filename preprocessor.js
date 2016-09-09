/*
 * Privee is released under the BSD 3-Clause License.
 * Copyright (c) 2014, Sebastian Zimmeck and Steven M. Bellovin
 * All rights reserved.
 *  
 * preprocessor.js prepares the machine learning (ML) classification and also attempts a rule and crowdsourcing classification of the current policy
 */

chrome.extension.onMessage.addListener(function(request, sender) {
	
	var CLASSIFICATION_SIZE = 6;
	var currentPolicy, webServiceName, training;
	
	currentPolicy = request.source;
	
	// if this is not training, preprocess the current policy
	if (request.action == "getSections") {
   		
   		// get current Web service name
		webServiceName = getWebServiceName(currentPolicy);
    	
    	// access online repository ToS;DR and check whether there are crowdsourcing results for current policy
  		$.getJSON("http://tosdr.org/index/services.json").done(function(data) {
		
			// if crowdsourcing results are available on ToS;DR, retrieve those
			if (data[webServiceName]) {
				
				// get grade from ToS;DR
				var grade = data[webServiceName].class;
				sessionStorage.setItem("crowdGrade", grade);
				
				// get classifications from ToS;DR
				var classifications;
				var name = data[webServiceName].points;
				classifications = crowdPreprocessor(name);
	  				
	  			chrome.extension.sendMessage({
					action: "returnClassifications",
					source: classifications
				});
			}
			
			// if no crowdsourcing results are available on ToS;DR, prepare automatic classification
			else {
				
				training = "no";
				
				for (var j=0; j<CLASSIFICATION_SIZE; j++) {
					// the jth section in the current privacy policy
					sessionStorage.setItem("section"+j, mlPreprocessor(currentPolicy, j, training));
				}
				
				chrome.extension.sendMessage({
					action: "returnSections",
				});		
			}	
		});
	}
	
	// if this is training, preprocess the training policies
	if (request.action == "getTrainingSections") {

		currentPolicy = sessionStorage.getItem("TRAIND");
		training = "yes";
		
		for (var j=0; j<CLASSIFICATION_SIZE; j++) {
			// the jth section in the current privacy policy
			sessionStorage.setItem("trainingSection"+j, mlPreprocessor(currentPolicy, j, training));
		}
		
		chrome.extension.sendMessage({
			action: "returnTrainingSections",
		});
	}
});


// extract Web service name from current website URL 
function getWebServiceName(policy) {
		
	var temp, tempArray, name;
	
	tempArray = policy.split(" ");
	temp = tempArray[0];
	tempArray = temp.split(".");
	
	if (temp.match(/www/g)) {
		name = tempArray[1];
	}
	
	else {
		
		if (tempArray.length == 2) {
			name = tempArray[0];
			tempArray = name.split("/");
			name = tempArray[2];
		}
		
		else {
			name = tempArray[1];
		}
	}
	
	return name;
}


// retrieve the crowdsourcing classifications from ToS;DR 
// pass in points (at http://tosdr.org/index/services.json) for current Web service name to retrieve its titles (e.g., at http://tosdr.org/points/ozS1etNH7ZA.json)
function crowdPreprocessor(name) {
	
	var grade;
	var allPoints = "";
	var allTitles = "";
	var tempArray = JSON.stringify(name).replace(/["\[\]]/g,"").split(",");
	
	for (var i=0; i<tempArray.length; i++) {
		getPoint(tempArray[i], function(pointString) {allPoints += pointString + " "});
		getTitle(tempArray[i], function(titleString) {allTitles += titleString + "~"});
	}
	
	sessionStorage.setItem("crowdClassificationPoints", allPoints.replace(/["]/g,""));	
	sessionStorage.setItem("crowdClassificationTitles", allTitles.replace(/["]/g,""));
	sessionStorage.setItem("CROWD_CLASSIFICATION_SIZE", allPoints.length);
	classifications = "crowdsourcing";
	
	return classifications;
}


// retrieve the crowdsourcing classifications from ToS;DR
// pass in current point to retrieve corresponding icon (called point as well) (e.g., from http://tosdr.org/points/ozS1etNH7ZA.json)
function getPoint(point, callback) {
	
	var currentPoint, pointString;
	
	$.ajax({
  		dataType: "json",
  		url: "https://tosdr.org/points/" + point + ".json",
  		async: false,
  		success: function(data) {
		currentPoint = data.tosdr.point;
		pointString = JSON.stringify(currentPoint);
		}
  	});
	
	callback(pointString);	
}


// retrieve the crowdsourcing classifications from ToS;DR
// pass in current point to retrieve corresponding title (e.g., from http://tosdr.org/points/ozS1etNH7ZA.json)
function getTitle(point, callback) {
	
	var title, titleString;
	
	$.ajax({
  		dataType: "json",
  		url: "https://tosdr.org/points/" + point + ".json",
  		async: false,
  		success: function(data) {
		title = data.title;
		titleString = JSON.stringify(title);
		}
  	});
	
	callback(titleString);	
}


// make rule classification and preprocess the policy for the machine learning classification
function mlPreprocessor (privacyPolicy, currentSection, training) {
	
	// regular expressions for rule classification (selection of bigram features from policy text)
	var ruleRegExArray = new Array(
	// collection 
	"noRule",
	// profiling
	"(\\bother\\b|\\boutside\\b) (\\bsourc.*)",
	// ad tracking
	"(\\bad\\b|\\badvertis.*) (\\bcompan.*|\\bnetwork.*|\\bprovider.*|\\bservin.*|\\bserve.*|\\bvendor.*)|(\\bcontext.*|\\bnetwork.*|\\bparti.*|\\bserv.*) (\\bad\\b|\\badvertis.*)",
	// ad disclosure
	"noRule",
	// limited retention
	"noRule",
	// encryption
	"(.*) (\\bencrypt.*|\\bssl.*)|(\\bsecur\\b) (\\bsocket.*|\\bprotocol.*|\\bweb.*)");
	
	// regular expressions for ML preprocessing (selection of bigram features from policy text)
	var mlRegExArray = new Array(
	// collection
	"(\\bcollect\\b|\\bobtain\\b|\\bgather\\b|\\breceiv\\b) (.+)|(.+) (\\bcollect\\b|\\bobtain\\b|\\bgather\\b|\\breceiv\\b)",
	// profiling
	"(\\bappend\\b|\\bcombin\\b|\\bsupplement\\b|\\bsourc\\b) (.+)|(.+) (\\bappend\\b|\\bcombin\\b|\\bsupplement\\b|\\bsourc\\b)",
	// ad tracking
	"(\\bad\\b|\\badvertis\\b|\\bmarket\\b) (.+)|(.+) (\\bad\\b|\\badvertis\\b|\\bmarket\\b)",
	// ad disclosure
	"(\\bselect\\b|\\btrust\\b|\\breput\\b|\\bcertain\\b) (\\bcompani\\b|\\bthird\\b|\\bparti\\b|\\bmarket\\b|\\bpartner\\b|\\borgan)|(\\bmarket\\b|\\bsend\\b|\\boffer\\b) (\\bto\\b|\\bproduct\\b|\\bservic\\b|\\bgood\\b)",
	// limited retention
	"(\\bretain\\b|\\bretent\\b|\\bbackup\\b|\\barchiv\\b|\\bresidu\\b|\\bindefinit\\b|\\blong\\b|\\blonger\\b|\\bobligation\\b) (.+)|(.+) (\\bretain\\b|\\bretent\\b|\\bbackup\\b|\\barchiv\\b|\\bresidu\\b|\\bindefinit\\b|\\blong\\b|\\blonger\\b|\\bobligation\\b)",
	// encryption
	"noNaiveBayes");

	// replacing punctuation with one whitespace allows for phrase recognition via the regex taking into account the sentence structure
	var policyText = privacyPolicy.replace(/[^a-zA-Z ]/g," ").toLowerCase().split(" ");
	var section, currentPhrase, currentWord1, currentWord2;
	
	// rule classification (not available for training documents, which will be all classified by ML, i.e. naive Bayes)
	if ((training == "no") && (ruleRegExArray[currentSection] != "noRule")) {
		
		for (var i in policyText) {
			
			currentPhrase = policyText[i==0?policyText.length-1:i-1] + " " + policyText[i];
			
			if (currentPhrase.match(ruleRegExArray[currentSection])) {
				section = "class";
				break;
			}
		}
	}
	
	// prepare naive Bayes classification, use stemming
	if (section == null) {
		
		section = " ";
		
		for (var i in policyText) {
			
			currentWord1 = stemmer(policyText[i==0?policyText.length-1:i-1]);
			currentWord2 = stemmer(policyText[i]); 
			
			if ((currentWord1 + " " + currentWord2).match(mlRegExArray[currentSection])) {
				section += currentWord1 + currentWord2 + " ";
			}
		}
	}
			
	// if no features have been extracted, it can be concluded that information is not collected, disclosed, etc.
	if (section == " ") {
		section = "complementClass";
	}
	
	return section;
}


// Porter stemmer in Javascript. Few comments, but it's easy to follow against the rules in the original
// paper, in
//
//  Porter, 1980, An algorithm for suffix stripping, Program, Vol. 14,
//  no. 3, pp 130-137,
//
// see also http://www.tartarus.org/~martin/PorterStemmer

// Release 1 be 'andargor', Jul 2004
// Release 2 (substantially revised) by Christopher McKenzie, Aug 2009

var stemmer = (function(){
	var step2list = {
			"ational" : "ate",
			"tional" : "tion",
			"enci" : "ence",
			"anci" : "ance",
			"izer" : "ize",
			"bli" : "ble",
			"alli" : "al",
			"entli" : "ent",
			"eli" : "e",
			"ousli" : "ous",
			"ization" : "ize",
			"ation" : "ate",
			"ator" : "ate",
			"alism" : "al",
			"iveness" : "ive",
			"fulness" : "ful",
			"ousness" : "ous",
			"aliti" : "al",
			"iviti" : "ive",
			"biliti" : "ble",
			"logi" : "log"
		},

		step3list = {
			"icate" : "ic",
			"ative" : "",
			"alize" : "al",
			"iciti" : "ic",
			"ical" : "ic",
			"ful" : "",
			"ness" : ""
		},

		c = "[^aeiou]",          // consonant
		v = "[aeiouy]",          // vowel
		C = c + "[^aeiouy]*",    // consonant sequence
		V = v + "[aeiou]*",      // vowel sequence

		mgr0 = "^(" + C + ")?" + V + C,               // [C]VC... is m>0
		meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$",  // [C]VC[V] is m=1
		mgr1 = "^(" + C + ")?" + V + C + V + C,       // [C]VCVC... is m>1
		s_v = "^(" + C + ")?" + v;                   // vowel in stem

	return function (w) {
		var 	stem,
			suffix,
			firstch,
			re,
			re2,
			re3,
			re4,
			origword = w;

		if (w.length < 3) { return w; }

		firstch = w.substr(0,1);
		if (firstch == "y") {
			w = firstch.toUpperCase() + w.substr(1);
		}

		// Step 1a
		re = /^(.+?)(ss|i)es$/;
		re2 = /^(.+?)([^s])s$/;

		if (re.test(w)) { w = w.replace(re,"$1$2"); }
		else if (re2.test(w)) {	w = w.replace(re2,"$1$2"); }

		// Step 1b
		re = /^(.+?)eed$/;
		re2 = /^(.+?)(ed|ing)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			re = new RegExp(mgr0);
			if (re.test(fp[1])) {
				re = /.$/;
				w = w.replace(re,"");
			}
		} else if (re2.test(w)) {
			var fp = re2.exec(w);
			stem = fp[1];
			re2 = new RegExp(s_v);
			if (re2.test(stem)) {
				w = stem;
				re2 = /(at|bl|iz)$/;
				re3 = new RegExp("([^aeiouylsz])\\1$");
				re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
				if (re2.test(w)) {	w = w + "e"; }
				else if (re3.test(w)) { re = /.$/; w = w.replace(re,""); }
				else if (re4.test(w)) { w = w + "e"; }
			}
		}

		// Step 1c
		re = /^(.+?)y$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			re = new RegExp(s_v);
			if (re.test(stem)) { w = stem + "i"; }
		}

		// Step 2
		re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			suffix = fp[2];
			re = new RegExp(mgr0);
			if (re.test(stem)) {
				w = stem + step2list[suffix];
			}
		}

		// Step 3
		re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			suffix = fp[2];
			re = new RegExp(mgr0);
			if (re.test(stem)) {
				w = stem + step3list[suffix];
			}
		}

		// Step 4
		re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
		re2 = /^(.+?)(s|t)(ion)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			re = new RegExp(mgr1);
			if (re.test(stem)) {
				w = stem;
			}
		} else if (re2.test(w)) {
			var fp = re2.exec(w);
			stem = fp[1] + fp[2];
			re2 = new RegExp(mgr1);
			if (re2.test(stem)) {
				w = stem;
			}
		}

		// Step 5
		re = /^(.+?)e$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			re = new RegExp(mgr1);
			re2 = new RegExp(meq1);
			re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
			if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
				w = stem;
			}
		}

		re = /ll$/;
		re2 = new RegExp(mgr1);
		if (re.test(w) && re2.test(w)) {
			re = /.$/;
			w = w.replace(re,"");
		}

		// and turn initial Y back to y

		if (firstch == "y") {
			w = firstch.toLowerCase() + w.substr(1);
		}

		return w;
	}
})();