'use strict';

const {Observable} = require('rxjs');
const {filter, share, withLatestFrom, map} = require('rxjs/operators');
const raf = require('raf-stream');

const frame = node => new Observable(observer => {
	const stream = raf(node);
	stream.on('data', dt => observer.next(dt));
	stream.on('error', err => observer.error(err));
	stream.on('end', () => observer.complete());
	return () => {
		stream.destroy();
	};
}).pipe(
	filter(dt => dt !== 0),
	share()
);

const loop = (state$, node) => frame(node).pipe(
	withLatestFrom(state$),
	map(([dt, state]) => ({dt, state}))
);

module.exports = {
	frame,
	loop
};
