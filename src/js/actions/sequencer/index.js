'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const {obj} = require('iblokz-data');
const {measureToBeatLength} = require('../../util/math');

const stream = new Subject();

const toggle = (bar, r, c) => {
	// console.log(bar, r, c);
	stream.onNext(state => {
		let pattern = state.sequencer.pattern.slice();
		pattern[bar] = pattern[bar] || [];
		pattern[bar][r] = pattern[bar][r] || [];
		pattern[bar][r][c] = pattern[bar][r][c] ? 0 : 1;
		// console.log(pattern, pattern[bar][r][c]);
		return obj.patch(state, 'sequencer', {pattern});
	});
};

const selectChannel = channel => stream.onNext(state =>
	obj.patch(state, 'sequencer', {
		channel: (state.sequencer.channel === channel)
			? -1
			: channel
	})
);

const addChannel = channel => stream.onNext(state =>
	obj.patch(state, 'sequencer', {
		channels: state.sequencer.channels.concat([0])
	})
);

const deleteChannel = channel => (channel > -1) && stream.onNext(state =>
	obj.patch(state, 'sequencer', {
		channels: [].concat(
			state.sequencer.channels.slice(0, channel),
			state.sequencer.channels.slice(channel + 1)
		),
		pattern: state.sequencer.pattern.map(pattern => pattern.filter((r, i) => i !== channel)),
		channel: (channel === state.sequencer.channel) ? -1 : state.sequencer.channel
	})
);

const setSample = (channel, sample) => (channel > -1) && stream.onNext(state =>
	obj.patch(state, 'sequencer', {
		channels: [].concat(
			state.sequencer.channels.slice(0, channel),
			[sample],
			state.sequencer.channels.slice(channel + 1)
		)
	})
);

const initial = {
	barCount: 0,
	bar: 0,
	channel: -1,
	channels: [
		3,
		17,
		8,
		13,
		6,
		7,
		4
	],
	pattern: [
		[
			[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
			[1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
			[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
		]
	]
};

module.exports = {
	stream,
	initial,
	toggle,
	selectChannel,
	addChannel,
	deleteChannel,
	setSample
};
