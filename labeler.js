/*
 * Privee is released under the BSD 3-Clause License.
 * Copyright (c) 2014, Sebastian Zimmeck and Steven M. Bellovin
 * All rights reserved.
 * 
 * labeler.js creates the label for the analyzed privacy policy
 * 
 */

chrome.extension.onMessage.addListener(function(request, sender) {
	
	if (request.action == "forwardClassifications") {
		
		var classifications = request.source;
		sessionStorage.setItem("classifications", classifications);
		
		if (classifications == "crowdsourcing") {
			crowdsourcingLabel();
		}
		
		else {
			classificationsLabel(classifications);
		}
		
		chrome.extension.sendMessage({
			action: "returnLabels"
		});
	}
});


// create label for crowdsourcing analysis
function crowdsourcingLabel() {
		
	var crowdGrade = sessionStorage.getItem("crowdGrade");
	var classes = new Array("good", "bad", "neutral", "blocker");
	var crowdClassificationPoints = sessionStorage.getItem("crowdClassificationPoints").split(" ");
	var crowdClassificationTitles = sessionStorage.getItem("crowdClassificationTitles").split("~");
	var CROWD_CLASSIFICATION_SIZE = sessionStorage.getItem("CROWD_CLASSIFICATION_SIZE");
	var crowdLabel = "";
	
	// overall grade according to ToS;DR
	if (crowdGrade == "false") {
		crowdLabel += '<p><center> &nbsp <img src="ToSDRClassNo.jpg"> </center></p>';
	}
	
	if (crowdGrade == "A") {
		crowdLabel += '<p><center> &nbsp <img src="ToSDRClassA.jpg"> </center></p>';
	}
	
	if (crowdGrade == "B") {
		crowdLabel += '<p><center> &nbsp <img src="ToSDRClassB.jpg"> </center></p>';
	}
	
	if (crowdGrade == "C") {
		crowdLabel += '<p><center> &nbsp <img src="ToSDRClassC.jpg"> </center></p>';
	}
	
	if (crowdGrade == "D") {
		crowdLabel += '<p><center> &nbsp <img src="ToSDRClassD.jpg"> </center></p>';
	}
	
	if (crowdGrade == "E") {
		crowdLabel += '<p><center> &nbsp <img src="ToSDRClassE.jpg"> </center></p>';
	}
	
	// classifications according to ToS;DR
	for (var j=0; j<CROWD_CLASSIFICATION_SIZE; j++) {
		
		if (crowdClassificationPoints[j] == "good") {
			crowdLabel += "<p>" + '&nbsp <img src="ToSDRgood.jpg" style="float:left">' + " " + '<font size="3">' + crowdClassificationTitles[j] + "</font>" + "</p>";
		}
		
		if (crowdClassificationPoints[j] == "bad") {
			crowdLabel += "<p>" + '&nbsp <img src="ToSDRbad.jpg" style="float:left">' + " " + '<font size="3">' + crowdClassificationTitles[j] + "</font>" + "</p>";
		}
		
		if (crowdClassificationPoints[j] == "neutral") {
			crowdLabel += "<p>" + '&nbsp <img src="ToSDRneutral.jpg" style="float:left">' + " " + '<font size="3">' + crowdClassificationTitles[j] + "</font>" + "</p>";
		}
		
		if (crowdClassificationPoints[j] == "blocker") {
			crowdLabel += "<p>" + '&nbsp <img src="ToSDRblocker.jpg" style="float:left">' + " " + '<font size="3">' + crowdClassificationTitles[j] + "</font>" + "</p>";
		}
	}
	
	crowdLabel += '<p> Provided by <a href="http://www.tosdr.org/" target="_blank">ToS;DR</a> </p>';
	sessionStorage.setItem("crowdLabel", crowdLabel)
}


// create label for automatic analysis
function classificationsLabel(classifications) {

	var classes = localStorage.getItem("classes").split(" ");
	var CLASSIFICATION_SIZE = localStorage.getItem("CSIZE");
	var classesLabels = new Array("Collection of Personal Info (such as e-mail address)", "Combination with Info from outside Companies", "Advertising Tracking (e.g., use of Ad Cookies)", "Disclosure of Personal Info to Advertisers", "Personal Info is only Archived for Limited Time", "Stored and/or Transmitted Info is Encrypted");
	var complementClassesLabels = new Array("No Collection of Personal Info (such as e-mail address)", "No Combination with Info from outside Companies", "No Advertising Tracking (e.g., no use of Ad Cookies)", "No Disclosure of Personal Info to Advertisers", "Personal Info is Archived for Unlimited Time", "Stored and Transmitted Info is not Encrypted");
	var grade = 0;
	
	// assigning classification labels
	for (var j=0; j<CLASSIFICATION_SIZE-2; j++) {
		
		if (classifications[j] == classes[j]) {
			sessionStorage.setItem("label"+j, '&nbsp <img src="minus.jpg">' + " " + '<font size="3">' + classesLabels[j]) + "</font>";
		}
		
		else {
			sessionStorage.setItem("label"+j, '&nbsp <img src="plus.jpg">' + " " + '<font size="3">' + complementClassesLabels[j]) + "</font>";
		}
	}
	
	for (var j=CLASSIFICATION_SIZE-2; j<CLASSIFICATION_SIZE; j++) {
		
		if (classifications[j] == classes[j]) {
			sessionStorage.setItem("label"+j, '&nbsp <img src="plus.jpg">' + " " + '<font size="3">' + classesLabels[j]) + "</font>";
		}
		
		else {
			sessionStorage.setItem("label"+j, '&nbsp <img src="neutral.jpg">' + " " + '<font size="3">' + complementClassesLabels[j]) + "</font>";
		}
	}
	
	// calculating overall grade and assigning grade label
	// for collection, profiling, ad tracking, and ad disclosure minus and plus points are assigned
	for (var j=0; j<CLASSIFICATION_SIZE-2; j++) {
		
		if (classifications[j] == classes[j]) {
			grade -= 1;
		}
		
		else {
			grade +=1;
		}
	}
	
	// for limited retention and encryption only plus points are assigned
	for (var j=CLASSIFICATION_SIZE-2; j<CLASSIFICATION_SIZE; j++) {
		
		if (classifications[j] == classes[j]) {
			grade += 1;
		}
	}
	
	// more than 1 point: above average privacy; -1 to 1 points: average privacy; less than -1 point: below average privacy
	if (grade > 1) {
		sessionStorage.setItem("grade", "A");
	}
	if (grade <= 1 && grade >= -1) {
		sessionStorage.setItem("grade", "B");
	}
	if (grade < -1) {
		sessionStorage.setItem("grade", "C");
	}
	
	// assigning headline and explanation labels
	sessionStorage.setItem("headline", 'Meaning of Grades and Symbols');
	sessionStorage.setItem("explanation1", '<img src="A.jpg"> = Above Average Overall Privacy');
	sessionStorage.setItem("explanation2", '<img src="B.jpg"> = Average Overall Privacy');
	sessionStorage.setItem("explanation3", '<img src="C.jpg"> = Below Average Overall Privacy');
	sessionStorage.setItem("explanation4", '<img src="plus.jpg"> = Good Privacy Practice');
	sessionStorage.setItem("explanation5", '<img src="neutral.jpg"> = Neutral Privacy Practice');
	sessionStorage.setItem("explanation6", '<img src="minus.jpg"> = Bad Privacy Practice');
	
}