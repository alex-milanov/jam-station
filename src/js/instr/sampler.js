'use strict';

/**
 * Sampler instrument.
 * @param {object} context: instance of the audio context.
 * @param {string} file: uri of the sample file.
 */
function Sampler(context, file, buffer) {
	this.context = context;
	this.file = file;
	this.buffer = buffer;
	var sampler = this;
	if (!buffer) {
		var request = new XMLHttpRequest();
		request.open('get', file, true);
		request.responseType = 'arraybuffer';
		request.onload = function() {
			context.decodeAudioData(request.response, function(buffer) {
				sampler.buffer = buffer;
			});
		};
		request.send();
	}
	this.volume = this.context.createGain();
	this.volume.gain.value = 0.4;
}

Sampler.prototype.setup = function(state) {
	this.source = this.context.createBufferSource();
	this.source.buffer = this.buffer;
	this.source.connect(this.volume);
	this.volume.connect(this.context.destination);
};

Sampler.prototype.trigger = function(state, start, end) {
	this.setup();

	start = start || this.context.currentTime;

	if (state.studio.volume)
		this.volume.gain.value = state.studio.volume;

	this.source.start(start);
	if (end) this.source.stop(end);
};

Sampler.prototype.play = function(duration) {
	var now = this.context.currentTime;
	this.trigger(now, now + duration);
};

Sampler.prototype.stop = function(time) {
	var now = this.context.currentTime;
	this.source.stop(time || now);
	this.volume.gain.value = 0;
};

Sampler.prototype.clone = function() {
	return new Sampler(this.context, this.file, this.buffer);
};

module.exports = Sampler;
