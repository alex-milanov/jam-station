'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

const {arr, obj} = require('iblokz-data');

const observe = source => (source instanceof Rx.Observable)
  ? source
  : (source.then instanceof Function)
    ? Rx.Observable.fromPromise(source)
    : Rx.Observable.just(source);

const adapt = o => Object.keys(o).filter(key => key !== 'initial').reduce((o2, key) => Object.assign({}, o2,
	(o[key] instanceof Function) && obj.keyValue(key, function() {
		observe(
			o[key].apply(null, Array.from(arguments))
		).subscribe(resp => o2.stream.onNext(resp));
	}) || (o[key] instanceof Object) && (() => {
		let o3 = adapt(o[key]);
		o3.stream.subscribe(resp => o2.stream.onNext(resp));
		return Object.assign({
			initial: Object.assign({}, o2.initial, obj.keyValue(key, o3.initial))
		}, obj.keyValue(key, o3));
	})() || obj.keyValue(key, o[key])
), {stream: new Rx.Subject(), initial: o.initial || {}});

module.exports = {
	adapt
};
