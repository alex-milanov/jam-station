'use strict';

// util
const {obj} = require('iblokz-data');
const {measureToBeatLength, calculateProgress} = require('../../util/math');
const {reanchor, derivePosition, MODIFIER} = require('../../util/position');
const {context} = require('iblokz-audio');

const initial = {
	bpm: 120,
	measure: '4/4',
	beatLength: 16,
	barsLength: 1,
	startAudioTime: false,
	playing: false,
	recording: false,
	startTime: null,
	cycleOffset: 0,
	cycleBase: 0,
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

/** Sync derived transport position into state (UI / recording). */
const syncTick = tick => state => obj.patch(state, ['studio', 'tick'], tick);

const play = () => state => {
	const wasPlaying = state.studio.playing;
	const now = context.currentTime;

	if (wasPlaying) {
		const anchors = reanchor(state.studio, now);
		const tick = derivePosition(
			Object.assign({}, state.studio, {playing: true, ...anchors}),
			state.sequencer,
			state.session,
			now
		);
		return obj.patch(state, 'studio', {
			playing: false,
			startTime: anchors.startTime,
			cycleOffset: anchors.cycleOffset,
			tick
		});
	}

	const resuming = state.studio.startTime != null;
	const pianoCh = state.session.selection.piano[0];
	const pianoBar = state.studio.tick.tracks[pianoCh]
		&& state.studio.tick.tracks[pianoCh].bar;
	return obj.patch(state, 'studio', {
		playing: true,
		startTime: now,
		cycleOffset: resuming ? state.studio.cycleOffset : 0,
		cycleBase: resuming ? state.studio.cycleBase : (pianoBar ?? state.studio.tick.bar ?? 0)
	});
};

const record = () => state => obj.patch(state, 'studio', {recording: !state.studio.recording});

const stop = () => state => obj.patch(state, 'studio', {
	playing: false,
	recording: false,
	startTime: null,
	cycleOffset: 0
});

const change = (prop, val) => state => {
	if (state.studio.playing && prop === 'bpm') {
		const now = context.currentTime;
		return obj.patch(state, 'studio', {
			bpm: val,
			startTime: now,
			cycleOffset: calculateProgress(
				state.studio.startTime, now, state.studio.cycleOffset,
				state.studio.bpm, state.studio.beatLength, MODIFIER
			)
		});
	}

	let next = obj.patch(state, ['studio', prop], val);
	if (prop === 'measure') {
		next = obj.patch(next, 'studio', {beatLength: measureToBeatLength(next.studio.measure)});
	}
	if (next.studio.playing && prop === 'measure') {
		const now = context.currentTime;
		const beatLength = next.studio.beatLength;
		next = obj.patch(next, 'studio', {
			startTime: now,
			cycleOffset: calculateProgress(
				state.studio.startTime, now, state.studio.cycleOffset,
				state.studio.bpm, state.studio.beatLength, MODIFIER
			)
		});
	}
	return next;
};

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

/** @deprecated use syncTick via transport service */
const tick = (time = context.currentTime) => state => {
	const tickData = derivePosition(state.studio, state.sequencer, state.session, time);
	return obj.patch(state, ['studio', 'tick'], tickData);
};

module.exports = {
	initial,
	play,
	record,
	stop,
	change,
	syncTick,
	tick,
	next,
	prev,
	MODIFIER
};
