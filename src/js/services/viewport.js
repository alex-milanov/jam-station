'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;

const hook = ({state$, actions}) => {
	// mouse movement
	/*
	$.fromEvent(document, 'mousemove')
		.subscribe(ev => actions.set(['viewport', 'mouse'], {
			x: ev.pageX,
			y: ev.pageY
		}));
	*/
	$.fromEvent(window, 'resize')
		.startWith({})
		.subscribe(ev => actions.set(['viewport', 'screen'], {
			width: window.innerWidth,
			height: window.innerHeight
		}));
};

module.exports = {
	hook
};
