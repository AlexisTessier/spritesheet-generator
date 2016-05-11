import {isArray, forEach, includes} from 'lodash'

let eventListenerCounter = 0;

class EventEmitter {
	constructor({
		eventList = []
	}={}) {
		this.options = {
			eventList
		};

		this.eventListener = {};
		forEach(this.options.eventList, event => {
			this.eventListener[event] = {};
		});
	}

	emit(eventName, ...params){
		forEach(this.eventListener[eventName], listener => {
			listener(...params);
		});
	}

	on(eventName, callback){
		if (!this.has(eventName)) {
			throw new Error('This EventEmitter has no event named "'+eventName+'" available.');
		}

		let eventListenerIdentifier = '_'+eventListenerCounter++;

		let eventListener = this.eventListener[eventName] || {};

		eventListener[eventListenerIdentifier] = callback;

		this.eventListener[eventName] = eventListener;

		return eventListenerIdentifier;
	}

	has(eventName){
		return includes(this.options.eventList, eventName);
	}

	off(eventName, eventListenerIdentifier){
		throw new Error('The off method is not implemented yet...');
		/*if (isArray(eventName)) {
			forEach(eventName, event => {
				this.off(event, eventListenerIdentifier);
			});
		}
		else if(isArray(eventListenerIdentifier)){
			foreach(eventListenerIdentifier, listener => {
				this.off(eventName, listener);
			});
		}
		else{
			let listenerList = this.eventListener[eventName];
		}*/
	}
}

EventEmitter.attachEventEmitterInterface = function (target, eventEmitterPropertyAlias = 'eventEmitter') {
	forEach(['emit', 'on', 'off'], method => {
		target.prototype[method] = function (...params) {
			this[eventEmitterPropertyAlias][method](...params);
		};
	});
};

export default EventEmitter;