@alexistessier/spritesheet-generator
==================

![Project Status : work in progress](https://img.shields.io/badge/Project%20status-work%20in%20progress-lightgrey.svg)

[![version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/AlexisTessier/spritesheet-generator#readme)
[![npm version](https://badge.fury.io/js/%40alexistessier%2Fspritesheet-generator.svg)](https://badge.fury.io/js/%40alexistessier%2Fspritesheet-generator)

[![Dependency Status](https://david-dm.org/AlexisTessier/spritesheet-generator.svg)](https://david-dm.org/AlexisTessier/spritesheet-generator)
[![devDependency Status](https://david-dm.org/AlexisTessier/spritesheet-generator/dev-status.svg)](https://david-dm.org/AlexisTessier/spritesheet-generator#info=devDependencies)

[Home Page](https://github.com/AlexisTessier/spritesheet-generator#readme)

A javascript spritesheet generator

Note
----
The module is not fully tested. So bugs or unexpected behaviour can happen (Sorry for the troubles waiting a clean 2.0.0 version).

Purpose
-------

+ Generate multiple .png spritesheets from directories
+ Generate a css preprocessor file containing abstract class and mixins for each sprite (only stylus for now, but you can create your own use a custom processor function).
+ Generate spritesheet and preprocessor tools for retina and other resolutions.

Install
-------

```
npm install @alexistessier/spritesheet-generator
```

How to use
----------

```javascript

var SpritesheetGenerator = require('@alexistessier/spritesheet-generator/factory');

var path = require('path');

var gen = SpritesheetGenerator({
	inputPath : path.join(__dirname, 'sources'),
	outputPath : path.join(__dirname, 'generated-spritesheets'),
	processor : 'stylus'
});

gen.run();

```

This basic usage example will take all the folders in the **inputPath**, and create one spritesheet for each, from all .png files in it. Note that **inputPath** can be a glob or an array of glob. The spritesheets (with the @2x version) and the preprocessor files are saved in **outputPath**

[See examples](https://github.com/AlexisTessier/spritesheet-generator/tree/master/examples) to see the kind of files which are generated.

Options
-------

| name | type | default value | description |
|------|------|---------------|-------------|
| inputPath | *array* or *string* | none | The path or a glob targeting files folder. Each folder will generate a distinct spritesheet. |
| inputSpritesheetPath | *array* or *string* | inputPath | An alias for inputPath |
| inputSpritePath | *string* | \*.png | The glob used to select the sprites files. Select all the .png files in the spritesheet folder by default. |
| outputPath | *string* or *function* | none | The path to the folder where you want to save spritesheets and preprocessor files. If a function is used, it takes *(spritesheetData, spritesheetGenerator)* as parameters and must return a folder path. |
| spritesheetsOutputPath | *string* | outputPath | The path to the folder where you want to save spritesheets |
| stylesheetsOutputPath | *string* | outputPath | The path to the folder where you want to save preprocessor files |
| processor | *string*, *function* or *array* | 'css' | A processor function takes a data object from the spritesheet generator instance as single parameters, and must return an array with the following information ['processorName', { fileName: fileContent, otherFileName: otherFileContent }, '.file_extension', data.options]. The list of files with their content are saved in the stylesheetsOutputPath. If a string is used, the generator will use one of default processor (only stylus currently)|
| processorOptions | object | empty object | Can be used to override some options for each processor. Overridable options are : ...|

####TO DO

+ processor functions format redefine, don't seperatate ext from file name

+ Document all options

```
/*

utilsPrefix = '', //replace with an utils name generator function
utilsSuffix = '', //replace with an utils name generator function
stylesheetPrefix = '', //replace with an stylesheet name generator function
stylesheetSuffix = '', //replace with an stylesheet name generator function
spritesheetPrefix = '', //replace with an spritesheet name generator function
spritesheetSuffix = '', //replace with an spritesheet name generator function
retina = true,
sourceResolution = retina ? 2 : 1,
resolutionList = retina ? [2, 1] : [1],
mainResolution = 1,
utilsResolutionSuffixFormatMethod = defaultUtilsResolutionSuffixFormatMethod, //remove
resolutionSuffixFormatMethod = defaultResolutionSuffixFormatMethod, //remove
spritesheetNameFromPathMethod = defaultSpritesheetNameFromPathMethod,
spritesheetNameFromPathArrayTakeRightNumber = 1, //find a better name ?
spriteGutter = 2,
imageUrlGenerationStrategy = 'absolute',
imageUrlGenerationStrategyAbsoluteBaseUrl 

*/
```
+ add processor specific options

+ add css processor and others

+ Document injectable dependencies

+ Add test suites

```