'use strict';

import {
	assign,
	last,
	keyBy,
	chain,
	isArray,
	map,
	isFunction,
	isObject,
	takeRight,
	forEach,
	size,
	isString
} from 'lodash';

import mkdirp from 'mkdirp';

import eventEmitterFactory from 'event-emitter';

import glob from 'glob';

import path from 'path';

import assert from 'assert';

import fs from 'fs';

import processorList from './processor'

/*--------------------*/

const BASE_SCREEN_DPI = 96;
const SPRITESHEET_FILE_EXTENSION = '.png';

function defaultResolutionSuffixFormatMethod(resolution, generator) {
	return '@'+resolution+'x';
}

function defaultUtilsResolutionSuffixFormatMethod(resolution, generator) {
	return '_'+resolution+'x';
}

function defaultSpritesheetNameFromPathMethod (spritesheetFolderPath, generator) {
	return takeRight(spritesheetFolderPath.split('/'), generator.spritesheetNameFromPathArrayTakeRightNumber).join('--');
}

class SpritesheetGenerator {
	constructor({
		inputPath,
		inputSpritesheetPath = inputPath,
		inputSpritePath = '*'+SPRITESHEET_FILE_EXTENSION,
		outputPath,
		spritesheetsOutputPath = outputPath,
		stylesheetsOutputPath = outputPath,
		processor = 'css',
		processorOptions = {},
		utilsPrefix = '',
		utilsSuffix = '',
		stylesheetPrefix = '',
		stylesheetSuffix = '',
		spritesheetPrefix = '',
		spritesheetSuffix = '',
		retina = true,
		sourceResolution = retina ? 2 : 1,
		availableResolutionList = retina ? [2, 1] : [1],
		mainResolution = 1,
		utilsResolutionSuffixFormatMethod = defaultUtilsResolutionSuffixFormatMethod,
		resolutionSuffixFormatMethod = defaultResolutionSuffixFormatMethod,
		spritesheetNameFromPathMethod = defaultSpritesheetNameFromPathMethod,
		spritesheetNameFromPathArrayTakeRightNumber = 1,
		spriteGutter = 2,
		imageUrlGenerationStrategy = 'absolute',
		imageUrlGenerationStrategyAbsoluteBaseUrl = '/'
	}={}) {

		assign(this, {
			inputPath,
			inputSpritesheetPath,
			inputSpritePath,
			outputPath,
			spritesheetsOutputPath,
			stylesheetsOutputPath,
			processor: isArray(processor) ? processor : [processor],
			processorOptions,
			utilsPrefix,
			utilsSuffix,
			stylesheetPrefix,
			stylesheetSuffix,
			spritesheetPrefix,
			spritesheetSuffix,
			sourceResolution,
			availableResolutionList,
			mainResolution,
			resolutionSuffixFormatMethod,
			utilsResolutionSuffixFormatMethod,
			spritesheetNameFromPathMethod,
			spritesheetNameFromPathArrayTakeRightNumber,
			spriteGutter,
			imageUrlGenerationStrategy,
			imageUrlGenerationStrategyAbsoluteBaseUrl
		});

		forEach(this.processor, processor => {
			let processorOptions = this.processorOptions[processor] || {};

			forEach([
				'imageUrlGenerationStrategy',
				'imageUrlGenerationStrategyAbsoluteBaseUrl',
				'utilsResolutionSuffixFormatMethod',
				'utilsPrefix',
				'utilsSuffix',
				['outputPath', 'stylesheetsOutputPath'],
				['prefix', 'stylesheetPrefix'],
				['suffix', 'stylesheetSuffix']
			], defaultOption => {
				let optionName = (isArray(defaultOption) ? defaultOption[0] : defaultOption);
				processorOptions[optionName] = isArray(defaultOption) ? 
				(processorOptions[optionName] || this[defaultOption[1]])
				: (processorOptions[defaultOption] || this[defaultOption]);
			});

			this.processorOptions[processor] = processorOptions;
		});

		this.availableEventList = ['after-run'];
		this.eventEmitter = eventEmitterFactory({});//new EventEmitter();

		this.spritesheetList = [];
		this.running = false;

		this.on('after-run', () => {
			this.running = false;
		});
	}

	inject({
		blockPackingMethod,
		imageProcessingLibrary,
		reporter
	}){
		assert(isFunction(blockPackingMethod), 'blockPackingMethod dependency must be a function');

		assert(isObject(imageProcessingLibrary), 'imageProcessingLibrary dependency must be an object');
		assert(isFunction(imageProcessingLibrary.read), 'imageProcessingLibrary dependency must implement a read method');
		assert(isFunction(imageProcessingLibrary.createImage), 'imageProcessingLibrary dependency must implement a createImage method');

		assert(isObject(reporter), 'reporter dependency must be an object');
		assert(isFunction(reporter.report), 'reporter dependency must implement a report method');

		assign(this, {
			blockPackingMethod,
			imageProcessingLibrary,
			reporter
		});

		return this;
	}

	/*--------------------------*/
	/*-- Component interfaces --*/
	/*--------------------------*/

	report(){
		return this.reporter.report(...arguments);
	}

	on(){
		return this.eventEmitter.on(...arguments);
	}

	off(){
		return this.eventEmitter.off(...arguments);
	}

	/*--------------------------*/
	/*--------------------------*/
	/*--------------------------*/

	run(){
		if (this.running) {
			throw new Error('SpritesheetGenerator is already running.');
			return;
		}

		this.generateSpritesheets();
		this.running = true;

		//this.eventEmitter.emit('after-run');
	}

	spritesheetInputFolderPath(spritesheetName){
		return path.join(this.inputSpritesheetPath, spritesheetName);
	}

	spritesheetNameFromFolderPath(spritesheetFolderPath){
		return this.spritesheetNameFromPathMethod(spritesheetFolderPath, this);
	}

	fetchFolderContent(folderPath, callback){
		glob(folderPath, (err, pathList) => {
			if (err) {throw err;return;}

			isFunction(callback) ? callback(pathList): null;
		});
	}

	fetchSpritesheetList(callback){
		this.fetchFolderContent(this.spritesheetInputFolderPath('*'), folders => {
			this.spritesheetList = chain(folders).keyBy(folder => {
				return this.spritesheetNameFromFolderPath(folder);
			}).mapValues((folderPath, name) => {
				return {name, folderPath};
			}).forEach((spritesheet, name) => {
				spritesheet.versionList = map(this.availableResolutionList, resolution => {
					return{
						name,
						resolution,
						minDpi: this.getMinDpiForResolution(resolution),
						ratio: resolution/this.sourceResolution,
						resolutionSuffix: this.resolutionSuffixFormatMethod(resolution, this),
						isMainResolution: resolution === this.mainResolution,
						folderPath: spritesheet.folderPath
					};
				});
			}).value();

			isFunction(callback) ? callback(this.spritesheetList): null;
		});
	}

	getMinDpiForResolution(resolution){
		return BASE_SCREEN_DPI*resolution;
	}

	fetchSpritesheetSpriteList(spritesheet, callback){
		this.fetchFolderContent(path.join(spritesheet.folderPath, this.inputSpritePath), sprites => {

			spritesheet.spriteList = chain(sprites).keyBy(sprite => {
				return path.basename(sprite, SPRITESHEET_FILE_EXTENSION);
			}).mapValues((filePath, name) => {
				return {
					name,
					filePath,
					fullName: spritesheet.name+'-'+name,
					ratio: spritesheet.ratio,
					isMainResolution: spritesheet.isMainResolution,
					resolution: spritesheet.resolution
				};
			}).value();

			isFunction(callback) ? callback(spritesheet.spriteList): null;
		});
	}

	generateSpritesheets(){
		this.fetchSpritesheetList(spritesheetList => {
			let spritesheetCount = size(spritesheetList);
			let packedSpritesheetCount = 0;

			forEach(spritesheetList, spritesheet => {
				let versionCount = size(spritesheet.versionList);
				let packedVersionCount = 0;
				forEach(spritesheet.versionList, version => {
					this.generateSpritesheet(version, ()=>{
						packedVersionCount++;

						if(packedVersionCount === versionCount){
							packedSpritesheetCount++;

							if(packedSpritesheetCount === spritesheetCount){
								this.generateStylesheet();
							}
						}
					});
				});
			});

		});
	}

	fetchSpriteListSpriteImage(spriteList, callback){
		let spriteFileOpenedCount = 0, spriteListSize = size(spriteList);

		forEach(spriteList, sprite => {
			this.imageProcessingLibrary.read(sprite.filePath, (err, spriteImage) => {
				if (err) {throw err;return;}

				let outputRect = {
					width: Math.round(spriteImage.bitmap.width*sprite.ratio),
					height: Math.round(spriteImage.bitmap.height*sprite.ratio)
				};

				assign(sprite, {
					image: spriteImage,
					w: outputRect.width+(this.spriteGutter*2),
					h: outputRect.height+(this.spriteGutter*2),
					outputRect
				});

				spriteFileOpenedCount++;

				if (spriteFileOpenedCount >= spriteListSize && isFunction(callback)) {
					callback(spriteList);
				}
			});

		});
	}

	generateSpritesheet(spritesheet, afterPackingCallback){
		this.fetchSpritesheetSpriteList(spritesheet, spriteList => {
			if (size(spriteList) === 0) {
				throw new Error('Spritesheet "'+spritesheet.name+'"" at path '+spritesheet.folderPath+' doesn\'t contain any sprite.');
			}

			this.fetchSpriteListSpriteImage(spriteList, spriteList => {
				this.packing(spritesheet, afterPackingCallback);
				this.composeSpritesheet(spritesheet);
			});
		});
	}

	packing(spritesheet, callback){
		let packSize = this.blockPackingMethod(
			chain(spritesheet.spriteList).map(sprite => {
				return sprite;
			}).sortBy(sprite => {
				return sprite.name;
			}).value()
		);

		assign(spritesheet, packSize);
		spritesheet.outputPath = this.generateSpritsheetOutputPath(spritesheet);

		forEach(spritesheet.spriteList, sprite => {
			sprite.outputRect.x = sprite.x+this.spriteGutter;
			sprite.outputRect.y = sprite.y+this.spriteGutter;
		});
		
		isFunction(callback) ? callback() : null;
	}

	composeSpritesheet(spritesheet){
		let spritesheetImage = this.imageProcessingLibrary.createImage(spritesheet.width, spritesheet.height, (err, spritesheetImage) => {
			if (err){throw err;return;}

			forEach(spritesheet.spriteList, sprite => {
				if(sprite.fit){
					if (sprite.ratio !== 1) {
						sprite.image.quality(100).resize(sprite.outputRect.width, sprite.outputRect.height);
					}
					spritesheetImage.composite(sprite.image, sprite.outputRect.x, sprite.outputRect.y);
				}

			});

			let outputPath = spritesheet.outputPath;

			this.createOutputDir(outputPath, () => {
				spritesheetImage.write(outputPath, err => {
					if (err){throw err;return;}
					
					this.report('notice', 'Spritesheet successfully generated at '+outputPath);
				});
			});
		});	
	}

	createOutputDir(outputPath, callback){
		mkdirp(path.dirname(outputPath), err => {
			if (err){throw err;return;}
			isFunction(callback) ? callback() : null;
		});
	}

	generateSpritsheetOutputPath(spritesheet){
		return path.join(this.spritesheetsOutputPath, (
			this.spritesheetPrefix+spritesheet.name+this.spritesheetSuffix+(
				spritesheet.isMainResolution ? '' : spritesheet.resolutionSuffix
			)+SPRITESHEET_FILE_EXTENSION
		));
	}

	generateStylesheetsOutputPath(stylesheetName){
		return path.join(this.stylesheetsOutputPath, stylesheetName);
	}

	generateStylesheet(){
		forEach(this.processor, processor => {
			let options = (isString(processor) ? this.processorOptions[processor] : this.processorOptions);
			this.writeStylesheetFiles(...(isString(processor) ? processorList[processor] : processor)(this.getProcessorData(options),
				options,
			this));
		});
	}

	getProcessorData(options){
		let spritesheetList = [];
		let sprites = [];

		forEach(this.spritesheetList, spritesheet => {
			spritesheetList.push(this.getSpritesheetProcessorData(spritesheet));
		});

		return {spritesheetList, options, generator: this};
	}

	getSpritesheetProcessorData(spritesheet, options){
		let utilName = this.utilName('spritesheet-'+spritesheet.name);
		let mainVersion = null, data = {}, spriteListData = {};

		forEach(spritesheet.versionList, version => {
			mainVersion = version.isMainResolution ? version : mainVersion;
			let _resolutionMarker = this.utilsResolutionSuffixFormatMethod(version.resolution);
			
			forEach(version.spriteList, sprite => {
				let spriteData = spriteListData[sprite.fullName] || {};
				spriteData[_resolutionMarker] = sprite.outputRect;
				spriteListData[sprite.fullName] = assign({}, spriteData, {
					spritesheetName: spritesheet.name
				});
			});

			data[_resolutionMarker] = {
				width: version.width,
				height: version.height,
				getUrl: function () {
					return "hello";
				}
				//url: this.imageUrlRelativeToStylesheetFile(version.outputPath, 'sprites'+ext)
			};
		});

		let mainVersionResolutionMarker = this.utilsResolutionSuffixFormatMethod(mainVersion.resolution);
		assign(data, data[mainVersionResolutionMarker], {
			name: utilName,
			mainResolution: mainVersionResolutionMarker
		});
		
		return data;
	}

	writeStylesheetFiles(processorName, files, ext){
		forEach(files, (fileContent, fileName) => {
			let outputPath = this.generateStylesheetsOutputPath(fileName)+ext;
			this.createOutputDir(outputPath, () => {
				fs.writeFile(outputPath, fileContent, err => {
					if (err){throw err;return;}

					this.report('notice', 'Processor '+processorName+' successfully generate '+outputPath);
				}); 
			})
		});
	}

	utilName(util, options = this){
		return options.utilsPrefix+util+options.utilsSuffix;
	}

	pathSetSep(filePath){
		return filePath.split(path.sep).join('/');
	}

	imageUrlRelativeToStylesheetFile(imagePath, fileName, strategy = this.imageUrlGenerationStrategy){
		if(strategy === 'absolute'){
			return this.pathSetSep(
				path.join(this.imageUrlGenerationStrategyAbsoluteBaseUrl, path.relative(this.spritesheetsOutputPath, imagePath))
			);
		}

		return './'+this.pathSetSep(path.relative(path.dirname(this.generateStylesheetsOutputPath(fileName)), imagePath));
	}
}

SpritesheetGenerator.defaultParameters = {
	resolutionSuffixFormatMethod: defaultResolutionSuffixFormatMethod,
	spritesheetNameFromPathMethod: defaultSpritesheetNameFromPathMethod,
	utilsResolutionSuffixFormatMethod: defaultUtilsResolutionSuffixFormatMethod
};

export default SpritesheetGenerator;