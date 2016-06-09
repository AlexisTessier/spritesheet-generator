
@alexistessier/spritesheet-generator
==================

[![version](https://img.shields.io/badge/version-1.0.2-blue.svg)](https://github.com/AlexisTessier/spritesheet-generator#readme)
[![npm version](https://badge.fury.io/js/%40alexistessier%2Fspritesheet-generator.svg)](https://badge.fury.io/js/%40alexistessier%2Fspritesheet-generator)

[![Dependency Status](https://david-dm.org/AlexisTessier/spritesheet-generator.svg)](https://david-dm.org/AlexisTessier/spritesheet-generator)
[![devDependency Status](https://david-dm.org/AlexisTessier/spritesheet-generator/dev-status.svg)](https://david-dm.org/AlexisTessier/spritesheet-generator#info=devDependencies)

[Home Page](https://github.com/AlexisTessier/spritesheet-generator#readme)

A javascript spritesheet generator

Note
----
The module is not fully tested. So bugs or unexpected behaviour can happen (Sorry for the troubles waiting a clean version 2.0.0).

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

```