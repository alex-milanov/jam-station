'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const {obj} = require('iblokz-data');
const {measureToBeatLength} = require('../../util/math');
const {context} = require('../../util/audio');

const initial = {
	bpm: '120',
	measure: '4/4',
	beatLength: 16,
	barsLength: 1,
	playing: false,
	recording: false,
	tick: {
		index: -1,
		time: 0,
		bar: 0
	},
	volume: 0.4,
	channels: [
		{
			instr: 'sampler',
			name: 'Sampler 1',
			volume: 0.4,
			props: {

			}
		},
		{
			instr: 'basicSynth',
			name: 'Basic Synth 1',
			volume: 0.4,
			props: {

			}
		},
		{
			instr: 'basicSynth',
			name: 'Basic Synth 2',
			volume: 0.4,
			props: {

			}
		}
	]
};

const tick = (time = context.currentTime) =>
	state => obj.patch(state, ['studio', 'tick'], {
		time,
		index: (state.studio.tick.index < state.studio.beatLength - 1) && (state.studio.tick.index + 1) || 0,
		bar: (state.studio.tick.index < state.studio.beatLength - 1)
			? state.studio.tick.bar
			: (state.studio.tick.bar < state.studio.barsLength - 1) && (state.studio.tick.bar + 1) || 0
	});

const play = () => state => obj.patch(state, 'studio', {playing: !state.studio.playing});

const record = () => state => obj.patch(state, 'studio', {recording: !state.studio.recording});

const stop = () => state => obj.patch(state, 'studio', {
	tick: {
		index: -1,
		time: 0,
		bar: 0
	},
	playing: false,
	recording: false
});

const change = (prop, val) =>
	state => [obj.patch(state, ['studio', prop], val)].map(
		state => (prop !== 'measure')
			? state
			: obj.patch(state, 'studio', {beatLength: measureToBeatLength(state.studio.measure)})
		).pop();

const next = () => state => obj.patch(state, ['studio', 'tick'], {
	bar: (state.studio.tick.bar < state.studio.barsLength - 1) ? state.studio.tick.bar + 1 : 0
});

const prev = () => state => obj.patch(state, ['studio', 'tick'], {
	bar: (state.studio.tick.bar > 0) ? state.studio.tick.bar - 1 : state.studio.barsLength - 1
});

module.exports = {
	initial,
	play,
	record,
	stop,
	change,
	tick,
	next,
	prev
};
