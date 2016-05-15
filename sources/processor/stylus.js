import {
	forEach,
	camelCase,
	assign
} from 'lodash';

export default function(gen) {
	return ['stylus', {
		tools: toolsFileContent(gen),
		sprites: spritesFileContent(gen)
	}, '.styl'];
};

let newLine = '\n';

function toolsFileContent(gen) {
	//console.log(gen);
	return '';
};

function spritesFileContent(gen) {
	let content = '';
	forEach(gen.spritesheetList, spritesheet => {
		content += utilSpritesheetSizeVar(spritesheet, gen);
	});

	return content;
};

function resolutionMarker(resolution){
	return '_'+resolution+'x';
}

function utilSpritesheetSizeVar(spritesheet, gen){
	let sizeVarName = gen.utilName(camelCase('spritesheet-'+spritesheet.name+'-size'));
	let mainVersion = null, sizeVarValue = {};
	forEach(spritesheet.versionList, version => {
		mainVersion = version.isMainResolution ? version : mainVersion;
		
		sizeVarValue[resolutionMarker(version.resolution)] = {
			width: version.width,
			height: version.height
		};
	});

	assign(sizeVarValue, sizeVarValue[resolutionMarker(mainVersion.resolution)]);

	return newLine+sizeVarName+' = '+JSON.stringify(sizeVarValue)+newLine;
}