'use strict';
const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const obj = require('iblokz/common/obj');
const {measureToBeatLength} = require('../../util/math');

const stream = new Subject();

const connect = midi => stream.onNext(
	state => Object.assign({}, state, {midi})
);

module.exports = {
	stream,
	connect
};
