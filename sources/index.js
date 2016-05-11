'use strict';

import {
	assign,
	last,
	keyBy,
	chain,
	isFunction,
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
		retina = false,
		sourceResolution = retina ? 2 : 1,
		availableResolutionList = retina ? [2, 1] : [1],
		mainResolution = 1,
		resolutionSuffixFormatMethod = defaultResolutionSuffixFormatMethod,
		spritesheetNameFromPathMethod = defaultSpritesheetNameFromPathMethod,
		spritesheetNameFromPathTakeRightNumber = 1
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
			spritesheetNameFromPathTakeRightNumber
		});

		this.eventEmitter = new EventEmitter({
			eventList : ['after-run']
		})

		this.spritesheetList = [];
		this.running = false;

		this.on('after-run', () => {
			this.running = false;
		});
	}

	inject({
		blockPackingMethod,
		imageProcessingLibrary
	}){
		assert(isFunction(blockPackingMethod), 'blockPackingMethod dependency must be a function');

		assert(isFunction(imageProcessingLibrary), 'imageProcessingLibrary dependency must be an function');
		assert(isFunction(imageProcessingLibrary.read), 'imageProcessingLibrary dependency must implement a read method');

		assign(this, {
			blockPackingMethod,
			imageProcessingLibrary
		});

		return this;
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
			}).mapValues((filePath, name) => {
				return {name, filePath};
			}).value();

			isFunction(callback) ? callback(this.spritesheetList): null;
		});
	}

	fetchSpritesheetSpriteList(spritesheet, callback){
		let fileExt = '.png';

		this.fetchFolderContent(path.join(spritesheet.filePath, '*'+fileExt), sprites => {

			spritesheet.spriteList = chain(sprites).keyBy(sprite => {
				return path.basename(sprite, fileExt);
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
			this.imageProcessingLibrary.read(sprite.filePath, function (err, spriteImage) {
				if (err) {throw err;return;}

				assign(sprite, {
					image: spriteImage,
					w: spriteImage.bitmap.width,
					h: spriteImage.bitmap.height
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
		console.log(spritesheet);
		//WORK IN PROGRESS
		//TO DO
		//pack with growing packer
		//create the spritesheet with jimp
	}
}

SpritesheetGenerator.defaultParameters = {
	resolutionSuffixFormatMethod: defaultResolutionSuffixFormatMethod,
	spritesheetNameFromPathMethod: defaultSpritesheetNameFromPathMethod
};

EventEmitter.attachEventEmitterInterface(SpritesheetGenerator);

export default SpritesheetGenerator;