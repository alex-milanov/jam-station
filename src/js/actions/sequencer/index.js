'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const {obj} = require('iblokz-data');
const {measureToBeatLength} = require('../../util/math');

const initial = {
	barsLength: 0,
	bar: 0,
	channel: -1,
	channels: [
		3,
		17,
		8,
		13,
		6
	],
	pattern: [
		[
			[1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
			[1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
			[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
		],
		[
			[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
			[1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
			[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
		],
		[
			[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
			[1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
			[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
		],
		[
			[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
			[1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
			[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
		]
	]
};

const toggle = (bar, r, c) =>
	state => {
		let pattern = state.sequencer.pattern.slice();
		pattern[bar] = pattern[bar] || [];
		pattern[bar][r] = pattern[bar][r] || [];
		pattern[bar][r][c] = pattern[bar][r][c] ? 0 : 1;
		// console.log(pattern, pattern[bar][r][c]);
		return obj.patch(state, 'sequencer', {pattern});
	};

const clear = () => state => {
	let pattern = state.sequencer.pattern.slice();
	if (state.sequencer.channel > -1) pattern[state.sequencer.bar][state.sequencer.channel] = [];
	return obj.patch(state, 'sequencer', {pattern});
};

const select = channel => state =>
	obj.patch(state, 'sequencer', {
		channel: (state.sequencer.channel === channel)
			? -1
			: channel
	});

const prev = () => state =>
	obj.patch(state, 'sequencer', {
		channel: (state.sequencer.channel > 0)
			? state.sequencer.channel - 1
			: state.sequencer.channels.length - 1
	});

const next = () => state =>
	obj.patch(state, 'sequencer', {
		channel: (state.sequencer.channel < state.sequencer.channels.length - 1)
			? state.sequencer.channel + 1
			: 0
	});

const add = channel => state =>
	obj.patch(state, 'sequencer', {
		channels: [].concat(state.sequencer.channels, [0]),
		channel: state.sequencer.channels.length
	});

const remove = () => state =>
	(state.sequencer.channel === -1)
	? state
	: obj.patch(state, 'sequencer', {
		channels: [].concat(
			state.sequencer.channels.slice(0, state.sequencer.channel),
			state.sequencer.channels.slice(state.sequencer.channel + 1)
		),
		pattern: state.sequencer.pattern.map(pattern => pattern.filter((r, i) => i !== state.sequencer.channel)),
		channel: -1
	});

const setSample = (channel, sample) => state =>
	obj.patch(state, 'sequencer', {
		channels: (channel > -1)
		? [].concat(
				state.sequencer.channels.slice(0, channel),
				[sample],
				state.sequencer.channels.slice(channel + 1)
			)
		: [].concat(state.sequencer.channels, [sample])
	});

module.exports = {
	initial,
	toggle,
	clear,
	select,
	prev,
	next,
	add,
	remove,
	setSample
};
