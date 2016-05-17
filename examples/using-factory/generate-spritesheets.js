var spritesheetGenerator = require('../../factory');

module.exports = function (afterRunCallback) {

	var path = require('path');

	var gen = spritesheetGenerator({
		inputPath : path.join(__dirname, 'sources'),
		outputPath : path.join(__dirname, 'generated-spritesheets'),
		processor : 'stylus'
	});

	gen.on('after-run', afterRunCallback);

	gen.run();
};