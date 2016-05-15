
output+=spriteSelectorList.join(', ')+'\n';
output+='	spritesheet("~'+spritesheetOutputName+'", '+spriteSheetSizeVarName+'.width px, '+spriteSheetSizeVarName+'.height px, '+(options.retina ? 'true' : 'false')+')\n';

for(var n = 0 ; n < blocks.length ; n++) {
	var block = blocks[n];
	if (block.fit) {
		var spriteSizeVarName = _.camelCase(block.img.selector+'-size');
		output+=spriteSizeVarName;

		var blockH = (block.rh%2);
		var blockW = (block.rw%2);
		console.log((block.rh + blockH))

		output+=' = {width: '+(block.rw+blockW)+', height: '+(block.rh + blockH)+', x: '+(block.fit.x+(2*ratio))+', y: '+(block.fit.y+(2*ratio))+'}';
		output+='\n'+block.img.selector+'\n';
		output+='	spritesheet-part('+spriteSizeVarName+'.width px, '+spriteSizeVarName+'.height px, '+spriteSizeVarName+'.x px, '+spriteSizeVarName+'.y px)\n';
	}
}