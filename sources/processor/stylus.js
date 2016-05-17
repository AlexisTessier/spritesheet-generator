import {
	forEach,
	camelCase,
	assign,
	chain,
	map,
	snakeCase,
	kebabCase,
	cloneDeep
} from 'lodash';

let ext = '.styl';

export default function stylusProcessor(data) {
	return ['stylus', {
		tools: toolsFileContent(data),
		sprites: spritesFileContent(data)
	}, ext, data.options];
};

let newLine = '\n', tab = '\t';

function getVarName(name){
	return camelCase(name);
}

function getMixinName(name){
	return snakeCase(name);
}

function getPlaceholderName(name){
	return '$'+kebabCase(name);
}

function variableDefinition(name, value){
	return name+' = '+value;
}

function jsonDefinition(name, value){
	return variableDefinition(name, JSON.stringify(value));
}

function mixinCall(name, args = ''){
	return name+'('+args+')';
}

function toolsFileContent(data) {
	return toolsFileContentSpritesheetMixin(data);
};

function toolsFileContentSpritesheetMixin(data) {
	let gen = data.generator;

	return getMixinName(gen.utilName('spritesheet', data.options))+'(spritesheetDescriptor, fullSpritesheet = false)'
		+newLine+tab+'baseMinDpi = '+gen.getMinDpiForResolution(1)
		+newLine+tab+'display: block'
		+newLine+tab+'background-repeat: no-repeat'
		+newLine+tab+'background-size: (spritesheetDescriptor.width)px (spritesheetDescriptor.height)px'
		+newLine+tab+'if fullSpritesheet'
		+newLine+tab+tab+'width: (spritesheetDescriptor.width)px'
		+newLine+tab+tab+'height: (spritesheetDescriptor.height)px'
		+newLine+tab+'backgroundImageUrl = spritesheetDescriptor.url'
		+newLine+tab+'background-image: url(backgroundImageUrl)'
		+newLine+tab+'for resolution in spritesheetDescriptor.resolutionList'
		+newLine+tab+tab+'currentResolution = spritesheetDescriptor[resolution]'
		+newLine+tab+tab+'if !currentResolution.isMainResolution'
		+newLine+tab+tab+tab+'@media '
		+'(-webkit-min-device-pixel-ratio: (currentResolution.resolutionValue)), '
		+'(min-resolution: (currentResolution.minDpi)dpi)'
		+newLine+tab+tab+tab+tab+'resolutionBackgroundImageUrl = currentResolution.url'
		+newLine+tab+tab+tab+tab+'background-image: url(resolutionBackgroundImageUrl)'
	;
}

function spritesFileContent(data) {
	return newLine+chain(data.spritesheetList).map(spritesheet => {
		return spritesheetContent(spritesheet, data);
	}).value().join(newLine);
};

function spritesheetContent(spritesheet, data) {
	return spritesheetContentVar(spritesheet, data)
		+newLine
		+spritesheetContentUtils(spritesheet, data)
		+newLine;
};

function getSpritesheetContentRawVarValue(spritesheet){
	let rawVarValue = cloneDeep(spritesheet);

	rawVarValue.url = rawVarValue.getUrl('sprites'+ext);
	delete rawVarValue.spriteList;
	delete rawVarValue.getUrl;

	return rawVarValue;
}

function spritesheetContentVar(spritesheet, data){
	let spritesheetVarName = getVarName(spritesheet.name);

	let spritesheetRawVarValue = getSpritesheetContentRawVarValue(spritesheet);
	forEach(spritesheetRawVarValue.resolutionList, resolution => {
		spritesheetRawVarValue[resolution] = getSpritesheetContentRawVarValue(spritesheetRawVarValue[resolution]);
	});

	return jsonDefinition(spritesheetVarName, spritesheetRawVarValue)+newLine+chain(spritesheet.spriteList).map(sprite => {
		let spriteVarName = getVarName(sprite.name);
		let spriteRawValue = cloneDeep(sprite);

		forEach(spritesheet.resolutionList, resolution => {
			spriteRawValue[resolution] = spritesheet[resolution].spriteList[sprite.name];
		});

		return jsonDefinition(spriteVarName, spriteRawValue);
	}).value().join(newLine);
};

let spritesheetContentUtilsStrategy = {};

spritesheetContentUtilsStrategy['mixin'] = function utilSpriteListToolStrategyMixin(spritesheet, data) {
	let spritesheetMixinName = getMixinName(spritesheet.name);
	return spritesheetMixinName+'(fullSpritesheet = true)'
		+newLine
		+tab
			+mixinCall(getMixinName(data.generator.utilName('spritesheet', data.options)), 
				getVarName(spritesheet.name)+', fullSpritesheet'
			)
		+newLine
		+chain(spritesheet.spriteList).map(sprite => {
			return getMixinName(sprite.name)+'()'
				+newLine
				+tab
					+mixinCall(spritesheetMixinName, 'fullSpritesheet: false')
				+newLine+tab
					+mixinCall(getMixinName(data.generator.utilName('sprite', data.options)), 
						getVarName(sprite.name)
					);
		}).value().join(newLine);
};

spritesheetContentUtilsStrategy['placeholder'] = function utilSpriteListToolStrategyPlaceholder(spritesheet, data) {
	return getPlaceholderName(spritesheet.name)
		+newLine
		+tab
			+mixinCall(getMixinName(spritesheet.name))
		+newLine
		+chain(spritesheet.spriteList).map(sprite => {
			return getPlaceholderName(sprite.name)
				+newLine
				+tab
					+mixinCall(getMixinName(sprite.name))
		}).join(newLine);
};

function spritesheetContentUtils(spritesheet, data){
	return newLine+map(['mixin', 'placeholder'], strategy => {
		return spritesheetContentUtilsStrategy[strategy](spritesheet, data);
	}).join(newLine+newLine);
};