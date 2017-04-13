'use strict';

const Rx = require('rx');
const $ = Rx.Observable;

const RxNode = require('rx-node');
const raf = require('raf-stream');

const frame = node => RxNode.fromStream(raf(node))
	.filter(dt => dt !== 0)
	.share();

const loop = (state$, node) => frame(node).withLatestFrom(state$, (dt, state) => ({dt, state}));

module.exports = {
	frame,
	loop
};
