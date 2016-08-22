'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const {assignPropVal} = require('../../util/data');
const {measureToBeatLength} = require('../../util/math');

const stream = new Subject();

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
	play,
	stop,
	tick
};
