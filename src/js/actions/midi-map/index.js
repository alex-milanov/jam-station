'use strict';
const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const {measureToBeatLength} = require('../../util/math');
const {obj, arr} = require('iblokz-data');

const arrMod = (a, p, v) => [].concat(
	a.slice(0, p[0]),
	[p.length === 1 ? v : arrMod(a[p[0]], p.slice(1), v)],
	a.slice(p[0] + 1)
);

const initial = {
	devices: {
		inputs: [],
		outputs: []
	},
	clock: {
		in: [],
		out: []
	},
	data: {
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
		devices,
		data: {
			...state.midiMap.data,
			in: state.midiMap.data.in.indexOf(devices.inputs.findIndex(dev => dev.name.match(/MPKmini2/))) === -1
				? arr.add(state.midiMap.data.in, devices.inputs.findIndex(dev => dev.name.match(/MPKmini2/)))
				: state.midiMap.data.in
		}
	});

const toggleClock = (inOut, index) => state => obj.patch(state, ['midiMap', 'clock', inOut],
	arr.toggle(obj.sub(state, ['midiMap', 'clock'])[inOut], index)
);

const toggleData = (inOut, index) => state => obj.patch(state, ['midiMap', 'data', inOut],
	arr.toggle(obj.sub(state, ['midiMap', 'data', inOut]), index)
);

const noteOn = (device = 0, channel, note, velocity = 0) => state => channel !== undefined ? (
	// console.log(state.midiMap.channels, obj.sub(state, ['midiMap', 'channels', channel, note]), channel, note, velocity),
	velocity !== 0
		? obj.patch(state, ['midiMap', 'channels', device, channel, note], velocity)
		: obj.patch(state, ['midiMap', 'channels', device], {
			[channel]: obj.filter(
				obj.sub(state, ['midiMap', 'channels', device, channel]) || {},
				(key, value) => key !== note)
		})
	) : state;

const panic = () => state =>
	obj.patch(state, ['midiMap', 'channels'], {});

const modify = (p, v) => state => obj.patch(state, ['midiMap'], {
	map: arrMod(state.midiMap.map, p, v)
});

module.exports = {
	initial,
	connect,
	toggleClock,
	toggleData,
	noteOn,
	panic,
	modify
};
