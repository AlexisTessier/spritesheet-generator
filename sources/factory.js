import SpritesheetGenerator from './index';
import injection from './injection/spritesheet-generator';

export default function() {
	return new SpritesheetGenerator(...arguments).inject(injection);
}