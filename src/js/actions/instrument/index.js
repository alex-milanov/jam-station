'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

const obj = require('iblokz/common/obj');

const stream = new Subject();

const updateProp = (prop, value) => stream.onNext(
	state => obj.patch(state, ['instrument', prop], value)
);

module.exports = {
	stream,
	updateProp
};
