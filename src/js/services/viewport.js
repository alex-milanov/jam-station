'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;

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
	subs.push(
		$.fromEvent(window, 'resize')
			.startWith({})
			.subscribe(ev => actions.set(['viewport', 'screen'], {
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
