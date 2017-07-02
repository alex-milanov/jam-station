'use strict';
const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const {measureToBeatLength} = require('../../util/math');
const {obj} = require('iblokz-data');

const initial = {
	devices: {
		inputs: [],
		outputs: []
	},
	clock: {
		in: false,
		out: false
	},
	map: {
		controller: {
			20: ['instrument', ['vcf', 'cutoff']],
			21: ['instrument', ['vcf', 'resonance']],
			22: ['studio', ['bpm'], 60, 200, 0],
			23: ['studio', ['volume']],
			24: ['instrument', ['eg', 'attack']],
			25: ['instrument', ['eg', 'decay']],
			26: ['instrument', ['eg', 'sustain']],
			27: ['instrument', ['eg', 'release']]
		}
	}
};

const connect = devices =>
	state => obj.patch(state, 'midiMap', {
		devices
	});

const toggleClock = (inOut, index) => state => obj.patch(state, ['midiMap', 'clock', inOut],
	obj.sub(state, ['midiMap', 'clock'])[inOut] === index ? false : index
);

module.exports = {
	initial,
	connect,
	toggleClock
};
