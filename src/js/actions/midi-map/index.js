'use strict';
const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const {measureToBeatLength} = require('../../util/math');
const {obj, arr} = require('iblokz-data');

const initial = {
	devices: {
		inputs: [],
		outputs: []
	},
	clock: {
		in: [],
		out: []
	},
	pitch: 0,
	channels: {
	},
	map: [
		['controller', 20, ['instrument', 'vcf', 'cutoff']],
		['controller', 21, ['instrument', 'vcf', 'resonance']],
		['controller', 22, ['studio', 'bpm'], 60, 200, 0],
		['controller', 23, ['studio', 'volume']],
		['controller', 24, ['instrument', 'eg', 'attack']],
		['controller', 25, ['instrument', 'eg', 'decay']],
		['controller', 26, ['instrument', 'eg', 'sustain']],
		['controller', 27, ['instrument', 'eg', 'release']]
	]
};

const connect = devices =>
	state => obj.patch(state, 'midiMap', {
		devices
	});

const toggleClock = (inOut, index) => state => obj.patch(state, ['midiMap', 'clock', inOut],
	arr.toggle(obj.sub(state, ['midiMap', 'clock'])[inOut], index)
);

const noteOn = (channel, note, velocity = 0) => state => (
	// console.log(channel, note, velocity),
	velocity !== 0
		? obj.patch(state, ['midiMap', 'channels', channel, note], velocity)
		: obj.patch(state, ['midiMap', 'channels'], {
			[channel]: obj.filter(
				obj.sub(state, ['midiMap', 'channels', channel]),
				(key, value) => key !== note)
		})
	);

const panic = () => state =>
	obj.patch(state, ['midiMap', 'channels'], {});

module.exports = {
	initial,
	connect,
	toggleClock,
	noteOn,
	panic
};
