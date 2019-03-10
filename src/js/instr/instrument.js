'use strict';

class Instrument {
	constructor(context) {
		this.context = context;
		this.output = this.context.createGain();
		this.voices = [];
		this.connections = [];
	}
	noteOn() {

	}
	noteOff() {

	}
	connect(destination) {
		if (this.connections.indexOf(destination) === -1)
			this.output.connect(destination);
	}
	disconnect(destination) {
		// if no connection specified disconnect from all
		if (typeof destination === 'undefined') {
			this.connections.forEach(connection => this.output.disconnect(connection));
			this.connections = [];
			return;
		}
		if (this.connections.indexOf(destination) > -1) {
			this.output.disconnect(destination);
			this.connections = this.connections.filter(connection => connection !== destination);
		}
	}
}

export default Instrument;
