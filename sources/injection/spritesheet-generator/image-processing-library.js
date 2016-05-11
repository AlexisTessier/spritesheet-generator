import jimp from 'jimp';
export default {
	read: function read(...args) {
		jimp.read(...args);
	},
	createImage: function createImage(...args) {
		return new jimp(...args);
	}
};