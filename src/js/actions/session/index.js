'use strict';

const {obj} = require('iblokz-data');

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
	tracks: [
		{
			name: 'Drums',
			type: 'seq',
			inst: {},
			measures: {
				0: {
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
			}
		},
		{
			name: 'Baseline',
			inst: {},
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
			inst: {},
			measures: {}
		},
		{
			name: 'Lead 1',
			type: 'piano',
			inst: {},
			measures: {}
		}
	],
	arrangement: [

	]
};

const select = (type, trackIndex, rowIndex) => state =>
	obj.patch(state, ['session', 'selection', type], [trackIndex, rowIndex]
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
