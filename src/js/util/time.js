import {Observable} from 'rxjs';
import {filter, share, withLatestFrom, map} from 'rxjs/operators';

/**
 * RAF delta-time stream. Optional `node` is accepted for API compatibility
 * (raf-stream used it); native rAF ignores it.
 */
export const frame = node => new Observable(obs => {
	let id;
	let last = 0;

	const onFrame = timestamp => {
		const dt = last > 0 ? timestamp - last : 0;
		last = timestamp;
		obs.next(dt);
		id = requestAnimationFrame(onFrame);
	};

	id = requestAnimationFrame(onFrame);
	return () => cancelAnimationFrame(id);
}).pipe(
	filter(dt => dt !== 0),
	share()
);

export const loop = (state$, node) => frame(node).pipe(
	withLatestFrom(state$),
	map(([dt, state]) => ({dt, state}))
);

export default {
	frame,
	loop
};
