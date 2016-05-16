import {
	forEach,
	camelCase,
	assign,
	chain,
	map,
	snakeCase,
	kebabCase
} from 'lodash';

let ext = '.styl';

export default function(data) {
	console.log(data.spritesheetList);

	return ['stylus', {
		tools: toolsFileContent(data.generator),
		sprites: spritesFileContent(data.generator)
	}, ext];
};

let newLine = '\n', tab = '\t';

function toolsFileContent(gen) {
	//console.log(gen);
	return '';
};

function spritesFileContent(gen) {
	return chain(gen.spritesheetList).map(spritesheet => {
		let spritesheetVar = utilSpritesheetVar(spritesheet, gen);
		
		return newLine+spritesheetVar.string
		+newLine
		+utilSpriteListTool(spritesheetVar.raw.spriteListData, gen);

	}).value().join(newLine);
};

function resolutionMarker(resolution){
	return '_'+resolution+'x';
}

function getVarName(name, gen){
	return gen.utilName(camelCase(name));
}

function getMixinName(name, gen){
	return gen.utilName(snakeCase(name));
}

function getPlaceholderName(name, gen){
	return '$'+gen.utilName(kebabCase(name));
}

function utilSpritesheetVar(spritesheet, gen){
	let varName = getVarName('spritesheet-'+spritesheet.name, gen);
	let mainVersion = null, varValue = {}, spriteListData = {};

	forEach(spritesheet.versionList, version => {
		mainVersion = version.isMainResolution ? version : mainVersion;
		let _resolutionMarker = resolutionMarker(version.resolution);
		
		forEach(version.spriteList, sprite => {
			let spriteData = spriteListData[sprite.fullName] || {};
			spriteData[_resolutionMarker] = sprite.outputRect;
			spriteListData[sprite.fullName] = assign({}, spriteData, {
				spritesheetName: spritesheet.name
			});
		});

		varValue[_resolutionMarker] = {
			width: version.width,
			height: version.height,
			url: gen.imageUrlRelativeToStylesheetFile(version.outputPath, 'sprites'+ext)
		};
	});

	let mainVersionResolutionMarker = resolutionMarker(mainVersion.resolution);
	assign(varValue, varValue[mainVersionResolutionMarker], {
		mainResolution: mainVersionResolutionMarker
	});

	return {
		raw: {
			varValue,
			spriteListData
		},
		string: (jsonDefinition(varName, varValue)+newLine)+(
			chain(spriteListData).map((spriteData, name) => {
				let dataVarName = getVarName('sprite-'+name, gen);
				assign(spriteData, spriteData[mainVersionResolutionMarker], {
					name,
					mainResolution: mainVersionResolutionMarker
				});
				return jsonDefinition(dataVarName, spriteData);
			}).value().join(newLine)
		)
	};
}

function variableDefinition(name, value){
	return name+' = '+value;
}

function jsonDefinition(name, value){
	return variableDefinition(name, JSON.stringify(value));
}

let utilSpriteListToolStrategy = {};

utilSpriteListToolStrategy['mixin'] = function utilSpriteListToolStrategyMixin(spriteList, gen) {
	return chain(spriteList).map((data, name) => {
		return getMixinName('sprite-'+name, gen)+newLine
			+tab+
				getMixinName('spritesheet', gen)+'('+getVarName('spritesheet-'+data.spritesheetName, gen)+')'
			+newLine+tab+
				getMixinName('sprite', gen)+'('+getVarName('sprite-'+name, gen)+')'
	}).join(newLine);
};

utilSpriteListToolStrategy['placeholder'] = function utilSpriteListToolStrategyPlaceholder(spriteList, gen) {
	return chain(spriteList).map((data, name) => {
		return getPlaceholderName('sprite-'+name, gen)+newLine
			+tab+
				getMixinName('sprite-'+name, gen)+'()'
	}).join(newLine);
};

function utilSpriteListTool(spriteList, gen){
	return newLine+map(['mixin', 'placeholder'], strategy => {
		return utilSpriteListToolStrategy[strategy](spriteList, gen);
	}).join(newLine+newLine);
};

