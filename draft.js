SpritesheetGenerator.prototype.createStylesheet = function(output, options) {
	var self = this;
	this.output = this.output || '';
	this.spriteSheetStyleReady = this.spriteSheetStyleReady || [];
	this.spriteSheetStyleReady.push(output);
	this.output += output;

	if (this.spriteSheetStyleReady.length >= this.spritesheetListCount) {
		var outputPath = path.join(options.outputPath, 'spritesheets.styl');
		fs.writeFile(outputPath, self.output, (err) => {
			if (err) throw err;
			console.log('Stylesheet successfully created at '+outputPath);
		});
	}
};


	//spritesheet
			if (!ratioSuffix) {
				var output = '\n';
				var spriteSheetSizeVarName = _.camelCase('spritesheet-'+name+deviceSuffix+'-size');
				output +=spriteSheetSizeVarName;
				output +=' = {width: '+spritesheetWidth+', height: '+spritesheetHeight+'}\n';

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

				self.createStylesheet(output, options);
			}
		}
	});
};