'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const obj = require('iblokz/common/obj');
const {measureToBeatLength} = require('../../util/math');

const stream = new Subject();

const toggle = (r, c) => {
	console.log(r, c);
	stream.onNext(state => {
		let pattern = state.pattern.slice();
		pattern[r] = pattern[r] || [];
		pattern[r][c] = pattern[r][c] ? 0 : 1;
		console.log(pattern, pattern[r][c]);
		return Object.assign({}, state, {pattern});
	});
};

module.exports = {
	stream,
	toggle
};
