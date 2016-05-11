'use strict';

import {
	assign,
	last,
	keyBy,
	chain,
	isFunction,
	isObject,
	takeRight,
	forEach,
	size
} from 'lodash';

import EventEmitter from './event-emitter';

import glob from 'glob';

import path from 'path';

import assert from 'assert';

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
		processor,
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
			processor,
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
			}).value();

			isFunction(callback) ? callback(this.spritesheetList): null;
		});
	}

	fetchSpritesheetSpriteList(spritesheet, callback){
		this.fetchFolderContent(path.join(spritesheet.folderPath, '*'+SPRITESHEET_FILE_EXTENSION), sprites => {

			spritesheet.spriteList = chain(sprites).keyBy(sprite => {
				return path.basename(sprite, SPRITESHEET_FILE_EXTENSION);
			}).mapValues((filePath, name) => {
				return {name, filePath};
			}).value();

			isFunction(callback) ? callback(spritesheet.spriteList): null;
		});
	}

	generateSpritesheets(){
		this.fetchSpritesheetList(spritesheetList => {
			forEach(spritesheetList, spritesheet => {
				this.generateSpritesheet(spritesheet);
			});
		});
	}

	fetchSpriteListSpriteImage(spriteList, callback){
		let spriteFileOpenedCount = 0, spriteListSize = size(spriteList);

		forEach(spriteList, sprite => {
			this.imageProcessingLibrary.read(sprite.filePath, (err, spriteImage) => {
				if (err) {throw err;return;}

				assign(sprite, {
					image: spriteImage,
					w: spriteImage.bitmap.width+(this.spriteGutter*2),
					h: spriteImage.bitmap.height+(this.spriteGutter*2)
				});

				spriteFileOpenedCount++;

				if (spriteFileOpenedCount >= spriteListSize && isFunction(callback)) {
					callback(spriteList);
				}
			});

		});
	}

	generateSpritesheet(spritesheet){
		this.fetchSpritesheetSpriteList(spritesheet, spriteList => {
			this.fetchSpriteListSpriteImage(spriteList, spriteList => {
				this.composeSpritesheet(spritesheet);
			});
		});
	}

	composeSpritesheet(spritesheet){
		let packSize = this.blockPackingMethod(
			chain(spritesheet.spriteList).map(sprite => {
				return sprite;
			}).sortBy(sprite => {
				return sprite.name;
			}).value()
		);

		assign(spritesheet, packSize);

		//WORK IN PROGRESS
		//TO DO
		//create the spritesheet with jimp for each available resolution

		forEach(this.availableResolutionList, resolution => {
			let ratio = resolution/this.sourceResolution;

			let spritesheetImage = this.imageProcessingLibrary.createImage(spritesheet.width, spritesheet.height, (err, image) => {
				if (err){throw err;return;}

				/*for(var n = 0 ; n < blocks.length ; n++) {
					var block = blocks[n];

					if (block.fit) {
						if (ratio !== 1) {
							block.img.image.quality(100).resize(block.rw, block.rh);
						}
						image.composite(block.img.image, block.fit.x+(2*ratio), block.fit.y+(2*ratio));
					}
				}*/

				let outputPath = this.generateSpritsheetOutputPath(spritesheet, resolution);
				console.log(outputPath)

				/*image.write(outputPath, err => {
					if (err) throw err;
					
					//console.log('Spritesheet successfully generated at '+spritesheetInfos.outputPath);
				});*/
			});
		});
	}

	generateSpritsheetOutputPath(spritesheet, resolution){
		return path.join(this.outputPath, (
			this.spritesheetPrefix+spritesheet.name+this.spritesheetSuffix+(
				resolution === this.mainResolution ? '' : this.resolutionSuffixFormatMethod(resolution)
			)+SPRITESHEET_FILE_EXTENSION
		));
	}
}

SpritesheetGenerator.defaultParameters = {
	resolutionSuffixFormatMethod: defaultResolutionSuffixFormatMethod,
	spritesheetNameFromPathMethod: defaultSpritesheetNameFromPathMethod
};

EventEmitter.attachEventEmitterInterface(SpritesheetGenerator);

export default SpritesheetGenerator;