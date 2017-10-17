// Copyright (c) 2012 Jordan Santell
// ref: https://github.com/web-audio-components/simple-reverb

'use strict';

/**
 * Simple Reverb constructor.
 *
 * @param {AudioContext} context
 * @param {object} opts
 * @param {number} opts.seconds
 * @param {number} opts.decay
 * @param {boolean} opts.reverse
 */

function SimpleReverb(context, opts) {
	this.input = context.createGain();
	this.output = context.createGain();
	this.reverb = context.createConvolver();

	this.wetLevel = context.createGain();
	this.dryLevel = context.createGain();
	this._context = context;

  // some internal connectionsthis.input.connect(this.reverb);
	this.input.connect(this.reverb);
	this.reverb.connect(this.wetLevel);
	this.wetLevel.connect(this.output);

	this.input.connect(this.dryLevel);
	this.dryLevel.connect(this.output);

	var p = this.meta.params;
	opts = opts || {};
	this._seconds = opts.seconds || p.seconds.defaultValue;
	this._decay = opts.decay || p.decay.defaultValue;
	this._reverse = opts.reverse || p.reverse.defaultValue;
	this._dry = opts.dry || p.dry.defaultValue;
	this._wet = opts.wet || p.wet.defaultValue;

	this.wetLevel.gain.value = this._wet;
	this.dryLevel.gain.value = this._dry;

	this._buildImpulse();
}

SimpleReverb.prototype = Object.create(null, {

	update: {
		value: function(opts) {
			// console.log(opts);
			if (
				this._seconds !== opts.seconds
				|| this._decay !== opts.decay
				|| this._reverse !== opts.reverse
			) {
				this._seconds = opts.seconds || this._seconds;
				this._decay = opts.decay || this._decay;
				this._reverse = (opts.reverse !== undefined) ? opts.reverse : this._reverse;
				this._buildImpulse();
			}

			if (
				this._wet !== opts.wet
				|| this._dry !== opts.dry
			) {
				this._wet = opts.wet || this._wet;
				this._dry = opts.dry || this._dry;
				this.wetLevel.gain.value = this._wet;
				this.dryLevel.gain.value = this._dry;
			}
		}
	},

	/**
	 * AudioNode prototype `connect` method.
	 *
	 * @param {AudioNode} dest
	 */

	connect: {
		value: function(dest) {
			this.output.connect(dest.input ? dest.input : dest);
		}
	},

	/**
	 * AudioNode prototype `disconnect` method.
	 */

	disconnect: {
		value: function() {
			this.output.disconnect();
		}
	},

	/**
	 * Utility function for building an impulse response
	 * from the module parameters.
	 */

	_buildImpulse: {
		value: function() {
			var rate = this._context.sampleRate;
			var length = rate * this.seconds;
			var decay = this.decay;
			var impulse = this._context.createBuffer(2, length, rate);
			var impulseL = impulse.getChannelData(0);
			var impulseR = impulse.getChannelData(1);
			var n;
			var i;

			for (i = 0; i < length; i++) {
				n = this.reverse === true ? length - i : i;
				impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
				impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
			}

			this.reverb.buffer = impulse;
		}
	},

	/**
	 * Module parameter metadata.
	 */

	meta: {
		value: {
			name: "SimpleReverb",
			params: {
				seconds: {
					min: 1,
					max: 50,
					defaultValue: 3,
					type: "float"
				},
				decay: {
					min: 0,
					max: 100,
					defaultValue: 2,
					type: "float"
				},
				reverse: {
					min: 0,
					max: 1,
					defaultValue: false,
					type: "bool"
				},
				dry: {
					min: 0,
					max: 1,
					defaultValue: 1,
					type: "float"
				},
				wet: {
					min: 0,
					max: 1,
					defaultValue: 0,
					type: "float"
				}
			}
		}
	},

	/**
	 * Public parameters.
	 */

	seconds: {
		enumerable: true,
		get: function() {
			return this._seconds;
		},
		set: function(value) {
			this._seconds = value;
			this._buildImpulse();
		}
	},

	decay: {
		enumerable: true,
		get: function() {
			return this._decay;
		},
		set: function(value) {
			this._decay = value;
			this._buildImpulse();
		}
	},

	reverse: {
		enumerable: true,
		get: function() {
			return this._reverse;
		},
		set: function(value) {
			this._reverse = value;
			this._buildImpulse();
		}
	}

});

/**
 * Exports.
 */

module.exports = SimpleReverb;
