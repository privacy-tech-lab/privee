/*
 * Privee is released under the BSD 3-Clause License.
 * Copyright (c) 2014, Sebastian Zimmeck and Steven M. Bellovin
 * All rights reserved.
 * 
 * popup.js prepares printing of the analysis results to the screen
 * to delete the training examples, put the following in line 45 of popup.html: <button id="delete">Delete Training Data</button>
 */

chrome.extension.onMessage.addListener(function(request, sender) {
  
	if (request.action == "forwardLabels") {
  	
	  	var classifications = sessionStorage.getItem("classifications");
	  	
	  	// create popup for crowdsourcing analysis
	  	if (classifications == "crowdsourcing") {
		  	crowdAnalysis.innerHTML = sessionStorage.getItem("crowdLabel");  
		}
	  	
	  	// create popup for automatic analysis
	  	else {
	  	
		    label0.innerHTML = sessionStorage.getItem("label0");
		    label1.innerHTML = sessionStorage.getItem("label1");
		    label2.innerHTML = sessionStorage.getItem("label2");
		    label3.innerHTML = sessionStorage.getItem("label3");
		    label4.innerHTML = sessionStorage.getItem("label4");
		    label5.innerHTML = sessionStorage.getItem("label5");
		    
		    headline.innerHTML = sessionStorage.getItem("headline");
		    explanation1.innerHTML = sessionStorage.getItem("explanation1");
		    explanation2.innerHTML = sessionStorage.getItem("explanation2");
		    explanation3.innerHTML = sessionStorage.getItem("explanation3");
		    explanation4.innerHTML = sessionStorage.getItem("explanation4");
		    explanation5.innerHTML = sessionStorage.getItem("explanation5");
		    explanation6.innerHTML = sessionStorage.getItem("explanation6");
		    
		    var grade = sessionStorage.getItem("grade");
		  
		    if (grade == "A") { 
		    	labelGrade.innerHTML = '<font color="00FF00" size="7">'+grade+'</font>';
		    }
		    
		    if (grade == "B") { 
		    	labelGrade.innerHTML = '<font color="#FFCC00" size="7">'+grade+'</font>';
		    }
		    
		    if (grade == "C") { 
		    	labelGrade.innerHTML = '<font color="#FF0000" size="7">'+grade+'</font>';
		    }
		}  
	}
});


function onWindowLoad() {

 chrome.tabs.executeScript(null, { file: "scraper.js" }, function() {});

		// Delete button
		document.querySelector("#delete").addEventListener("click", function() {
			localStorage.clear();
			// Fire off notification
			chrome.extension.sendMessage({
				action: "trainingDataDeleted"
			});
		});

};

window.onload = onWindowLoad;