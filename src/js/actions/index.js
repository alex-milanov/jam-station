'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const assignPropVal = (o, p, v) => {
	let t = {};
	t[p] = v;
	return Object.assign({}, o, t);
};

const parseMeasure = measure => measure.split('/')
	.map(v => parseInt(v, 10))
	.reduce((p, v, i) => (i === 0) ? p * v : p / v, 16);

const stream = new Subject();

const init = () => stream.onNext(state => ({
	bpm: '120',
	measure: '4/4',
	beatLength: 16,
	instr: [
		'Kick',
		'HiHat',
		'Snare',
		'Clap'
	],
	pattern: [
		[1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
		[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	],
	playing: false,
	tickIndex: -1
}));

const change = (prop, val) =>
	stream.onNext(state => [assignPropVal(state, prop, val)].map(
		state => (prop !== 'measure')
			? state
			: Object.assign({}, state, {beatLength: parseMeasure(state.measure)})
		).pop());

const toggle = (r, c) =>
	stream.onNext(state => {
		let pattern = state.pattern.slice();
		pattern[r] = pattern[r] || [];
		pattern[r][c] = pattern[r][c] ? 0 : 1;
		return Object.assign({}, state, {pattern});
	});

const tick = () => stream.onNext(
	state => assignPropVal(state, 'tickIndex',
		(state.tickIndex < state.beatLength - 1) && (state.tickIndex + 1) || 0
	)
);

const play = () => stream.onNext(state => Object.assign({}, state, {playing: !state.playing}));

const stop = () => stream.onNext(state => Object.assign({}, state, {
	tickIndex: -1,
	playing: false
}));

module.exports = {
	stream,
	init,
	change,
	toggle,
	play,
	stop,
	tick
};
