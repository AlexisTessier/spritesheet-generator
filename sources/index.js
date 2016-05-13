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

import EventEmitter from './event-emitter';

import glob from 'glob';

import path from 'path';

import assert from 'assert';

import processorList from './processor'

/*--------------------*/

const BASE_SCREEN_DPI = 96;
const SPRITESHEET_FILE_EXTENSION = '.png';

function defaultResolutionSuffixFormatMethod(resolution, processor, image, generator) {
	return '@'+resolution+'x';
}

function defaultSpritesheetNameFromPathMethod (spritesheetFolderPath, generator) {
	return takeRight(spritesheetFolderPath.split('/'), generator.spritesheetNameFromPathTakeRightNumber).join('--');
}

class SpritesheetGenerator {
	constructor({
		inputPath,
		outputPath,
		processor = 'css',
		processorUtilsStrategy = 'both', //mixin, abstract class or both
		processorUtilsPrefix = '',
		processorUtilsSuffix = '',
		spritesheetPrefix = '',
		spritesheetSuffix = '',
		retina = true,
		sourceResolution = retina ? 2 : 1,
		availableResolutionList = retina ? [2, 1] : [1],
		mainResolution = 1,
		resolutionSuffixFormatMethod = defaultResolutionSuffixFormatMethod,
		spritesheetNameFromPathMethod = defaultSpritesheetNameFromPathMethod,
		spritesheetNameFromPathTakeRightNumber = 1,
		spriteGutter = 2
	}={}) {

		assign(this, {
			inputPath,
			outputPath,
			processor: isArray(processor) ? processor : [processor],
			processorUtilsStrategy,
			processorUtilsPrefix,
			processorUtilsSuffix,
			spritesheetPrefix,
			spritesheetSuffix,
			sourceResolution,
			availableResolutionList,
			mainResolution,
			resolutionSuffixFormatMethod,
			spritesheetNameFromPathMethod,
			spritesheetNameFromPathTakeRightNumber,
			spriteGutter
		});

		this.eventEmitter = new EventEmitter({
			eventList : ['after-run']
		});

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

	report(...args){
		this.reporter.report(...args);
	}

	run(){
		if (this.running) {
			throw new Error('SpritesheetGenerator is already running.');
			return;
		}

		this.generateSpritesheets();
		this.running = true;

		//this.emit('after-run');
	}

	spritesheetInputFolderPath(spritesheetName){
		return path.join(this.inputPath, spritesheetName);
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
						ratio: resolution/this.sourceResolution,
						resolutionSuffix: this.resolutionSuffixFormatMethod(resolution),
						isMainResolution: resolution === this.mainResolution,
						folderPath: spritesheet.folderPath
					};
				});
			}).value();

			isFunction(callback) ? callback(this.spritesheetList): null;
		});
	}

	fetchSpritesheetSpriteList(spritesheet, callback){
		this.fetchFolderContent(path.join(spritesheet.folderPath, '*'+SPRITESHEET_FILE_EXTENSION), sprites => {

			spritesheet.spriteList = chain(sprites).keyBy(sprite => {
				return path.basename(sprite, SPRITESHEET_FILE_EXTENSION);
			}).mapValues((filePath, name) => {
				return {name, filePath, ratio: spritesheet.ratio};
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

				let outputSize = {
					width: Math.round(spriteImage.bitmap.width*sprite.ratio),
					height: Math.round(spriteImage.bitmap.height*sprite.ratio)
				};

				assign(sprite, {
					image: spriteImage,
					w: outputSize.width+(this.spriteGutter*2),
					h: outputSize.height+(this.spriteGutter*2),
					outputSize
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
		
		isFunction(callback) ? callback() : null;
	}

	composeSpritesheet(spritesheet){
		let spritesheetImage = this.imageProcessingLibrary.createImage(spritesheet.width, spritesheet.height, (err, spritesheetImage) => {
			if (err){throw err;return;}

			forEach(spritesheet.spriteList, sprite => {
				if(sprite.fit){
					if (sprite.ratio !== 1) {
						sprite.image.quality(100).resize(sprite.outputSize.width, sprite.outputSize.height);
					}
					spritesheetImage.composite(sprite.image, sprite.x+this.spriteGutter, sprite.y+this.spriteGutter);
				}

			});

			let outputPath = this.generateSpritsheetOutputPath(spritesheet);

			mkdirp(path.dirname(outputPath), err => {
			    if (err){throw err;return;}

			    spritesheetImage.write(outputPath, err => {
					if (err){throw err;return;}
					
					this.report('notice', 'Spritesheet successfully generated at '+outputPath);
				});
			});
		});	
	}

	generateSpritsheetOutputPath(spritesheet){
		return path.join(this.outputPath, (
			this.spritesheetPrefix+spritesheet.name+this.spritesheetSuffix+(
				spritesheet.isMainResolution ? '' : spritesheet.resolutionSuffix
			)+SPRITESHEET_FILE_EXTENSION
		));
	}

	generateStylesheet(){
		forEach(this.processor, processor => {
			this.runStylesheetProcessor(isString(processor) ? processorList[processor] : processor);
		});
	}

	runStylesheetProcessor(processor){
		console.log(processor);
	}
}

SpritesheetGenerator.defaultParameters = {
	resolutionSuffixFormatMethod: defaultResolutionSuffixFormatMethod,
	spritesheetNameFromPathMethod: defaultSpritesheetNameFromPathMethod
};

EventEmitter.attachEventEmitterInterface(SpritesheetGenerator);

export default SpritesheetGenerator;