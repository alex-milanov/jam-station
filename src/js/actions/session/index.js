'use strict';

const {obj} = require('iblokz-data');

const defValues = {
	pianoRoll: require('../piano-roll').initial,
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
		{}
	],
	active: [
		0, 0, 0, 0
	],
	tracks: [
		{
			name: 'Drums',
			type: 'seq',
			inst: {},
			measures: [
				{
					name: 'Sample Beat',
					row: 0,
					barLength: 1,
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
			name: 'Baseline',
			inst: {
			},
			type: 'piano',
			measures: [
				{
					name: 'Sample Baseline',
					row: 0,
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
			measures: []
		},
		{
			name: 'Lead 1',
			type: 'piano',
			measures: []
		}
	],
	arrangement: [

	]
};

const select = (type, trackNumber, measureRow) => state =>
	Object.assign(
		obj.patch(state, ['session', 'selection', type], [trackNumber, measureRow]),
		(type === 'seq')
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

module.exports = {
	select,
	initial
};
