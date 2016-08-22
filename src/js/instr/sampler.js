'use strict';

/**
 * Sampler instrument.
 * @param {object} context: instance of the audio context.
 * @param {string} file: uri of the sample file.
 */
function Sampler(context, file) {
	this.context = context;
	var sampler = this;
	var request = new XMLHttpRequest();
	request.open('get', file, true);
	request.responseType = 'arraybuffer';
	request.onload = function() {
		context.decodeAudioData(request.response, function(buffer) {
			sampler.buffer = buffer;
		});
	};
	request.send();

	this.volume = this.context.createGain();
	this.volume.gain.value = 0.4;
}

Sampler.prototype.setup = function() {
	this.source = this.context.createBufferSource();
	this.source.buffer = this.buffer;
	this.source.connect(this.volume);
	this.volume.connect(this.context.destination);
};

Sampler.prototype.trigger = function(start, end) {
	this.setup();
	this.source.start(start);
	if (end) this.source.stop(end);
};

Sampler.prototype.play = function(duration) {
	var now = this.context.currentTime;
	this.trigger(now, now + duration);
};

module.exports = Sampler;
