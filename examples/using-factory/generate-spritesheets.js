var spritesheetGenerator = require('../../factory');

module.exports = function (afterRunCallback) {

	/*@README example*/

	var path = require('path');

	var gen = spritesheetGenerator({
		inputPath : path.join(__dirname, 'sources'),
		outputPath : path.join(__dirname, 'generated-spritesheets'),
		processor : 'stylus'
	});

	/*@README hide*/
	gen.on('after-run', afterRunCallback);
	/*@README show*/

	gen.run();

	/*@README end*/
};