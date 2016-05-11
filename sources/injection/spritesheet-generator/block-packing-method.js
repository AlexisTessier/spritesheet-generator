import GrowingPacker from 'jakes-gordon-growing-packer';

export default function blockPacking(blocks) {
	let packer = new GrowingPacker({
		blocks
	});

	let pack = packer.pack();
	pack.rectangles();

	return packer.size;
};