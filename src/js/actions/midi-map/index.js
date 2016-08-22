'use strict';
const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const {assignPropVal} = require('../../util/data');
const {measureToBeatLength} = require('../../util/math');

const stream = new Subject();

module.exports = {
	stream
};
