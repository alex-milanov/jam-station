'use strict';
// lib
const {fromEvent} = require('rxjs');

let unhook = () => {};

const hook = ({state$, actions}) => {
	let subs = [];
	// mouse movement
	/*
	$.fromEvent(document, 'mousemove')
		.subscribe(ev => actions.set(['viewport', 'mouse'], {
			x: ev.pageX,
			y: ev.pageY
		}));
	*/
	const {startWith} = require('rxjs/operators');
	subs.push(
		fromEvent(window, 'resize').pipe(
			startWith({})
		).subscribe(ev => actions.set(['viewport', 'screen'], {
				width: window.innerWidth,
				height: window.innerHeight,
				size: window.innerWidth >= 1200
					? 'xl'
					: window.innerWidth >= 992
						? 'lg'
						: window.innerWidth >= 768
							? 'md'
							: window.innerWidth >= 576
								? 'sm'
								: 'xs'
			}))
	);

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	unhook
};
