var SpritesheetGenerator = require('../../index');

module.exports = function (afterRunCallback) {
	
	var path = require('path');

	var gen = new SpritesheetGenerator({
		inputPath : path.join(__dirname, 'sources'),
		outputPath : path.join(__dirname, 'generated-spritesheets'),
		processor : 'stylus',
		processorOptions: {
			stylus: {
				imageUrlGenerationStrategy: 'relative',
				imageUrlGenerationStrategyAbsoluteBaseUrl: '/'
			}
		}
	}).inject(require('../../injection/spritesheet-generator'));

	gen.on('after-run', afterRunCallback);

	gen.run();
};