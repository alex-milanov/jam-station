'use strict';

const {obj} = require('iblokz-data');

const synthInstrument = {
	...require('../instrument').initial,
	source: require('../instrument').synthSource,
	sourceType: 'synth'
};

const samplerInstrument = {
	...require('../instrument').initial,
	source: require('../instrument').samplerSource,
	sourceType: 'sampler'
};

const defValues = {
	pianoRoll: require('../../services/piano-roll').actions.initial,
	sequencer: require('../sequencer').initial,
	instrument: require('../instrument').initial
};

const initial = {
	title: 'Untitled Piece',
	author: 'Anonymous Author',
	bpm: 104,
	ticks: 128,
	selection: {
		instr: [1, 0],
		piano: [1, 0],
		seq: [0, 0]
	},
	rows: [
		{},
		{},
		{},
		{}
	],
	active: [
		0, 0, 0, 0
	],
	tracks: [
		{
			name: 'Drums',
			type: 'seq',
			input: {
				device: -1,
				channel: 10
			},
			output: {
				device: -1,
				channel: 10
			},
			inst: samplerInstrument,
			measures: [
				{
					name: 'Beat',
					row: 0,
					barsLength: 1,
					loop: true,
					pattern: [
						[
							[1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
							[1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
							[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
						]
					]
				}
			]
		},
		{
			name: 'Bassline',
			input: {
				device: -1,
				channel: 1
			},
			output: {
				device: -1,
				channel: 1
			},
			inst: synthInstrument,
			type: 'piano',
			measures: [
				{
					name: 'Baseline',
					row: 0,
					barsLength: 1,
					events: [
						{
							note: 'C2',
							// tick index
							start: 0,
							// in relation to ticks / tick = 1/16
							duration: 1
						},
						{
							note: 'G2',
							// tick index
							start: 4,
							// in relation to ticks / tick = 1/16
							duration: 2
						},
						{
							note: 'C2',
							// tick index
							start: 7,
							// in relation to ticks / tick = 1/16
							duration: 1
						},
						{
							note: 'C2',
							// tick index
							start: 10,
							// in relation to ticks / tick = 1/16
							duration: 1
						},
						{
							note: 'G2',
							// tick index
							start: 12,
							// in relation to ticks / tick = 1/16
							duration: 2
						},
						{
							note: 'F#2',
							// tick index
							start: 14,
							// in relation to ticks / tick = 1/16
							duration: 1
						}
					]
				}
			]
		},
		{
			name: 'Comp 1',
			type: 'piano',
			inst: synthInstrument,
			input: {
				device: -1,
				channel: 1
			},
			output: {
				device: -1,
				channel: 1
			},
			measures: []
		},
		{
			name: 'Lead 1',
			type: 'piano',
			inst: synthInstrument,
			input: {
				device: -1,
				channel: 1
			},
			output: {
				device: -1,
				channel: 1
			},
			measures: []
		}
	],
	arrangement: [

	]
};

const select = (trackNumber, measureRow) => state => {
	const track = state.session.tracks[trackNumber];
	const trackType = track.type;
	
	// Update selection for the track type (piano or seq)
	const updatedState = obj.patch(state, ['session', 'selection', trackType], [trackNumber, measureRow]);
	
	// Always update selection.instr (for instrument UI)
	const stateWithInstr = obj.patch(updatedState, ['session', 'selection', 'instr'], [trackNumber, measureRow]);
	
	// Update sequencer or pianoRoll based on track type
	const trackInstrument = track.inst || defValues.instrument;
	// Ensure effectsChain exists and is an array
	const instrument = Object.assign({}, trackInstrument, {
		effectsChain: (trackInstrument.effectsChain || defValues.instrument.effectsChain || []).filter(e => e && e.type)
	});
	
	if (trackType === 'seq') {
		return Object.assign(stateWithInstr, {
			sequencer: Object.assign(
				{}, track.measures[measureRow] || defValues.sequencer
			),
			instrument
		});
	} else {
		// piano/synth track
		return Object.assign(stateWithInstr, {
			pianoRoll: Object.assign(
				{}, track.measures[measureRow] || defValues.pianoRoll
			),
			instrument
		});
	}
};

const activate = (track, ch) => state => obj.patch(state, ['session', 'active'],
	state.session.active.map((c, i) => i === track ? ch : c)
);

const updateTrackInput = (index, type, value) => state => obj.patch(state, 'session', {
	tracks: [].concat(
		state.session.tracks.slice(0, index),
		obj.patch(state.session.tracks[index], 'input', {
			[type]: value
		}),
		state.session.tracks.slice(index + 1)
	)
});

const updateTrackOutput = (index, type, value) => state => obj.patch(state, 'session', {
	tracks: [].concat(
		state.session.tracks.slice(0, index),
		obj.patch(state.session.tracks[index], 'output', {
			[type]: value
		}),
		state.session.tracks.slice(index + 1)
	)
});

module.exports = {
	initial,
	select,
	activate,
	updateTrackInput,
	updateTrackOutput
};
