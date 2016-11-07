'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

const {assignPropVal} = require('../../util/data');

const stream = new Subject();

const updateProp = (prop, value) => stream.onNext(state => Object.assign({}, state, {
	instrument: assignPropVal(state.instrument, prop, value)
}));

module.exports = {
	stream,
	updateProp
};
