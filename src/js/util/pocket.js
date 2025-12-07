'use strict';

const {Subject, BehaviorSubject} = require('rxjs');
const {scan} = require('rxjs/operators');
const {obj} = require('iblokz-data');

let pocket;

let reducers$ = new Subject();
let pocket$ = new BehaviorSubject({});

reducers$.pipe(
	scan((pocket, reduce) => reduce(pocket), {})
).subscribe(pocket => pocket$.next(pocket));

pocket$.subscribe(_pocket => {
	// console.log({pocket});
	pocket = _pocket;
});

const put = (path, val) => reducers$.next(pocket => obj.patch(pocket, path, val));
const get = path => obj.sub(pocket, path);

module.exports = {
	put,
	get,
	reducers$,
	stream: pocket$
};
