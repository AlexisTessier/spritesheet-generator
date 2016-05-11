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

SpritesheetGenerator.prototype.generateSpritesheet = function(name, descriptor, options, ratio, ratioSuffix) {
	var self = this;
	var deviceList = descriptor.deviceList;
	var styleClassPrefix = 'sprite-'+name;
	var ratio = typeof ratio === 'number' ? ratio : 1;
	var ratioSuffix = typeof ratioSuffix === 'string' ? ratioSuffix : false;

	_.forEach(deviceList, function (device, deviceName) {
		var spriteSelectorList = [];
		var deviceSuffix = (deviceName === 'default-device' ? '' : '-'+deviceName);
		var spritesheetOutputName = styleClassPrefix+deviceSuffix+(ratioSuffix || '')+'.png';
		var spritesheetImageContent = [];

		var spriteCount = _.keys(device).length;

		function spriteProcessingReady(){
			var spritesheetInfos ={
				width: 0,
				height: 0,
				outputPath: path.join(options.outputPath, spritesheetOutputName)
			};

			var packer = new GrowingPacker();
			var blocks=[];

			_.forEach(spritesheetImageContent, function (img) {
				var w = img.image.bitmap.width*ratio;
				var h = img.image.bitmap.height*ratio;
				blocks.push({
					rh: parseInt(h, 10),
					rw: parseInt(w, 10),
					w : Math.floor(w)+(4*ratio),
					h: Math.floor(h)+(4*ratio),
					img: img
				});
			});

			var sort = {
				random  : function (a,b) { return Math.random() - 0.5; },
				w       : function (a,b) { return b.w - a.w; },
				h       : function (a,b) { return b.h - a.h; },
				a       : function (a,b) { return b.area - a.area; },
				max     : function (a,b) { return Math.max(b.w, b.h) - Math.max(a.w, a.h); },
				min     : function (a,b) { return Math.min(b.w, b.h) - Math.min(a.w, a.h); },

				height  : function (a,b) { return sort.msort(a, b, ['h', 'w']);               },
				width   : function (a,b) { return sort.msort(a, b, ['w', 'h']);               },
				area    : function (a,b) { return sort.msort(a, b, ['a', 'h', 'w']);          },
				maxside : function (a,b) { return sort.msort(a, b, ['max', 'min', 'h', 'w']); },

				msort: function(a, b, criteria) { /* sort by multiple criteria */
				  var diff, n;
				  for (n = 0 ; n < criteria.length ; n++) {
					diff = sort[criteria[n]](a,b);
					if (diff != 0)
					  return diff;  
				  }
				  return 0;
				}
			};

			blocks.sort(sort.maxside);
			packer.fit(blocks);
			var spritesheetWidth = packer.root.w, spritesheetHeight = packer.root.h;

			var spritesheet = new jimp(spritesheetWidth, spritesheetHeight, function (err, image) {
				if (err) throw err;

				for(var n = 0 ; n < blocks.length ; n++) {
					var block = blocks[n];

					if (block.fit) {
						if (ratio !== 1) {
							block.img.image.quality(100).resize(block.rw, block.rh);
						}
						image.composite(block.img.image, block.fit.x+(2*ratio), block.fit.y+(2*ratio));
					}
				}

				image.write(spritesheetInfos.outputPath, function (err) {
					if (err) throw err;
					console.log('Spritesheet successfully generated at '+spritesheetInfos.outputPath);
				});
			});

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