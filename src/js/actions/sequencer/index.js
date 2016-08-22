'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const {assignPropVal} = require('../../util/data');
const {measureToBeatLength} = require('../../util/math');

const stream = new Subject();

const change = (prop, val) =>
	stream.onNext(state => [assignPropVal(state, prop, val)].map(
		state => (prop !== 'measure')
			? state
			: Object.assign({}, state, {beatLength: measureToBeatLength(state.measure)})
		).pop());

const toggle = (r, c) =>
	stream.onNext(state => {
		let pattern = state.pattern.slice();
		pattern[r] = pattern[r] || [];
		pattern[r][c] = pattern[r][c] ? 0 : 1;
		return Object.assign({}, state, {pattern});
	});

module.exports = {
	stream,
	change,
	toggle
};
