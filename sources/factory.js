import SpritesheetGenerator from './index';
import injection from './injection/spritesheet-generator';

export default function(...args) {
	return new SpritesheetGenerator(...args).inject(injection);
}