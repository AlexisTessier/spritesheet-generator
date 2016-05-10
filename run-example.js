'use strict';

require('source-map-support').install();

var examplesToRun = require('minimist')(process.argv.slice(2))._;

var report = require('@alexistessier/report');
var glob = require('glob');
var path = require('path');

var forEach = require('lodash/forEach');
var intersection = require('lodash/intersection');
var map = require('lodash/map');
var isEmpty = require('lodash/isEmpty');

/*-----------------*/

report('notice', '-- spritesheet-generator --');

glob(examplePath('*'), {
	cwd: __dirname
}, function (err, files) {
	if (err) {throw err;return;}

	var allExamples = map(files, function (file) {
		return file.split('/')[1];
	});
	
	forEach(
		isEmpty(examplesToRun) ? allExamples : intersection(allExamples, examplesToRun),
	runExample);
});

/*----------------*/

function examplePath (exampleName) {
	return "examples/"+exampleName+"/generate-spritesheets.js";
}

function runExample (exampleName) {
	var example = require(path.join(__dirname, examplePath(exampleName)));

	report('notice', '-- '+exampleName+' example starts running --');

	example(function () {
		report('notice', '-- '+exampleName+' example ends running --');
	});
}