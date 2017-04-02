'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const {obj} = require('iblokz-data');
const {measureToBeatLength} = require('../../util/math');

const stream = new Subject();

const tick = () => stream.onNext(
	state => obj.patch(state, ['studio', 'tickIndex'],
		(state.studio.tickIndex < state.studio.beatLength - 1) && (state.studio.tickIndex + 1) || 0
	)
);

const play = () => stream.onNext(state => obj.patch(state, 'studio', {playing: !state.studio.playing}));

const record = () => stream.onNext(state => obj.patch(state, 'studio', {recording: !state.studio.recording}));

const stop = () => stream.onNext(state => obj.patch(state, 'studio', {
	tickIndex: -1,
	playing: false,
	recording: false
}));

const change = (prop, val) =>
	stream.onNext(state => [obj.patch(state, ['studio', prop], val)].map(
		state => (prop !== 'measure')
			? state
			: obj.patch(state, 'studio', {beatLength: measureToBeatLength(state.studio.measure)})
		).pop());

module.exports = {
	stream,
	initial: {
		bpm: '120',
		measure: '4/4',
		beatLength: 16,
		playing: false,
		recording: false,
		tickIndex: -1,
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
	},
	play,
	record,
	stop,
	change,
	tick
};
