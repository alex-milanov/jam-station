'use strict';

// util
const {obj} = require('iblokz-data');
const {measureToBeatLength} = require('../../util/math');
const {context} = require('../../util/audio');

const initial = {
	bpm: 120,
	measure: '4/4',
	beatLength: 16,
	barsLength: 1,
	startAudioTime: false,
	playing: false,
	recording: false,
	tick: {
		index: -1,
		time: 0,
		bar: 0,
		elapsed: -1,
		tracks: [{index: -1}, {index: -1}, {index: -1}, {index: -1}]
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

const progress = ({beatLength, barsLength, index, bar, elapsed}) => ({
	index: elapsed % beatLength, // (index < beatLength - 1) ? index + 1 : 0,
	bar: parseInt(elapsed / beatLength, 10) % barsLength // (index < beatLength - 1) ? bar : (bar < barsLength - 1) ? bar + 1 : 0
});

const tick = (time = context.currentTime) =>
	state => obj.patch(state, ['studio', 'tick'], Object.assign({
		time,
		elapsed: state.studio.tick.elapsed + 1,
		tracks: state.session.tracks.map((track, _i) =>
			progress({
				index: state.studio.tick.tracks[_i] && state.studio.tick.tracks[_i].index || 0,
				bar: state.studio.tick.tracks[_i] && state.studio.tick.tracks[_i].bar || 0,
				beatLength: state.studio.beatLength,
				barsLength: track.measures[state.session.active[_i]] && track.measures[state.session.active[_i]].barsLength || 1,
				elapsed: state.studio.tick.elapsed + 1
			})
		)
	}, progress({
		index: state.studio.tick.index, bar: state.studio.tick.bar,
		beatLength: state.studio.beatLength, barsLength: state.sequencer.barsLength,
		elapsed: state.studio.tick.elapsed + 1
	})));

const play = () => state => obj.patch(state, 'studio', {
	playing: !state.studio.playing,
	tick: Object.assign({}, state.studio.tick, state.studio.playing ? {} : {})
});

const record = () => state => obj.patch(state, 'studio', {recording: !state.studio.recording});

const stop = () => state => obj.patch(state, 'studio', {
	tick: {
		index: -1,
		time: 0,
		bar: 0,
		elapsed: -1,
		tracks: [{index: -1}, {index: -1}, {index: -1}, {index: -1}]
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
	bar: (state.studio.tick.bar < state.sequencer.barsLength - 1) ? state.studio.tick.bar + 1 : 0,
	tracks: state.session.tracks.map((track, _i) =>
		Object.assign({}, state.studio.tick.tracks[_i] || {}, {
			bar: state.studio.tick.tracks[_i].bar < track.measures[state.session.active[_i]].barsLength - 1
				? state.studio.tick.tracks[_i].bar + 1
				: 0
		})
	)
});

const prev = () => state => obj.patch(state, ['studio', 'tick'], {
	bar: (state.studio.tick.bar > 0) ? state.studio.tick.bar - 1 : state.sequencer.barsLength - 1,
	tracks: state.session.tracks.map((track, _i) =>
		Object.assign({}, state.studio.tick.tracks[_i] || {}, {
			bar: state.studio.tick.tracks[_i].bar > 0
				? state.studio.tick.tracks[_i].bar - 1
				: track.measures[state.session.active[_i]].barsLength - 1
		})
	)
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
