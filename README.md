# Privee (v1.2)

Privee: An Architecture for Automatically Analyzing Web Privacy Policies  
Sebastian Zimmeck and Steven M. Bellovin  
23rd USENIX Security Symposium (USENIX), San Diego, CA, USA, August 2014  
(also presented at PLSC 2014 and FoPNaC 2014)

## 1. What is Privee?

Privee aims to make Web privacy policies easier and faster to understand. To that end, this Privee browser extension applies two different analysis methods: (1) It retrieves privacy policy analysis results from the crowdsourcing repository ToS;DR or, (2) if no such results are available, performs an automatic analysis based on rule and machine learning classification techniques.

Privee is a research project, and you can find our paper here: http://sebastianzimmeck.de/zimmeckAndBellovin2014Privee.pdf

The software here can be also installed from the chrome web store: https://chrome.google.com/webstore/detail/privee/lmhnkfilbojonenmnagllnoiganihmnl?hl=en

## 2. Source Files

- manifest.json is the manifest file required for every Google Chrome extension
- jQuery.js contains the jQuery JavaScript Library v1.11.0
- background.js manages the different components of the privacy policy analysis
- scraper.js obtains the URL and body text of the current website
- preprocessor.js prepares the machine learning (ML) classification and also attempts a rule and crowdsourcing classification of the current policy
- trainer.js trains the ML classifier
- trainingData.js contains a database of 100 training privacy policies for training the ML classifier
- classifier.js contains the ML classifier
- labeler.js creates the label for the analyzed privacy policy
- popup.js prepares printing of the analysis results to the screen
- popup.html displays a popup window for the analysis results
- about.html displays details of the automatic classification categories and the grading of the policies

## 3. Software requirements

Windows or OSX with Google Chrome (tested for Version 38.0.2125.122 m)

## 4. Installing and Running Privee

If you obtained a packed extension at the chrome web store, follow their installation instructions. If you obtained source files, save those at a convenient location, and load the folder as an unpacked extension within Google Chrome (Settings -> Extensions -> Load unpacked extension...). To run Privee go to the website with the privacy policy that you want to analyze and push the P button in the upper right hand corner of Google Chrome. The first ML classifier run takes one minute to analyze training data.

## 5. Version History

- v1.2 changed font sizes for better display (11/13/2014)
- v1.1 added functionality to retrieve ToS;DR symbols/points for individual classifications (08/06/2014)
- v1.0 initial limited release (06/27/2014)

## 6. License

Privee is released under the BSD 3-Clause License, 2014, Sebastian Zimmeck and Steven M. Bellovin.

## 7. Contact Info

For feedback and questions please contact Sebastian Zimmeck at sebastian@privacytechlab.org
