'use strict';

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
	settings: {
		midiRouteToActive: true
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

const findAutoConnectMpkIndex = inputs => {
	const ivMidi = inputs.findIndex(dev => /MPK Mini IV MIDI Port/i.test(dev.name));
	if (ivMidi > -1) return ivMidi;
	const mk2 = inputs.findIndex(dev => /MPKmini2/i.test(dev.name));
	if (mk2 > -1) return mk2;
	return inputs.findIndex(dev => /MPK Mini IV/i.test(dev.name));
};

const connect = devices =>
	state => {
		const mpkIndex = findAutoConnectMpkIndex(devices.inputs);
		const dataIn = mpkIndex > -1 && state.midiMap.data.in.indexOf(mpkIndex) === -1
			? arr.add(state.midiMap.data.in, mpkIndex)
			: state.midiMap.data.in;
		return obj.patch(state, 'midiMap', {
			devices,
			data: {
				...state.midiMap.data,
				in: dataIn
			}
		});
	};

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
