'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {obj} = require('iblokz-data');

let pocket;

let reducers$ = new Rx.Subject();
let pocket$ = new Rx.BehaviorSubject({});

reducers$
	.scan((pocket, reduce) => reduce(pocket), {})
	.subscribe(pocket => pocket$.onNext(pocket));

pocket$.subscribe(_pocket => {
	// console.log({pocket});
	pocket = _pocket;
});

const put = (path, val) => reducers$.onNext(pocket => obj.patch(pocket, path, val));
const get = path => obj.sub(pocket, path);

module.exports = {
	put,
	get,
	reducers$,
	stream: pocket$
};
