'use strict';

const {obj} = require('iblokz-data');

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
			inst: {},
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
			inst: defValues.instrument,
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
			inst: defValues.instrument,
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
			inst: defValues.instrument,
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

const select = (trackNumber, measureRow) => state =>
	Object.assign(
		obj.patch(state, ['session', 'selection', state.session.tracks[trackNumber].type], [trackNumber, measureRow]),
		(state.session.tracks[trackNumber].type === 'seq')
			? {
				sequencer: Object.assign(
					{}, state.session.tracks[trackNumber].measures[measureRow] || defValues.sequencer
				)
			}
			: {
				pianoRoll: Object.assign(
					{}, state.session.tracks[trackNumber].measures[measureRow] || defValues.pianoRoll
				),
				instrument: Object.assign(
					{}, state.session.tracks[trackNumber].inst || defValues.instrument
				)
			}
	/*
		(obj.sub(state, ['session', 'selection', type]).join('.') === [trackIndex, rowIndex].join('.'))
			? []
			: [trackIndex, rowIndex]
	*/
	);

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
