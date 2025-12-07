'use strict';

const time = require('./time');
const {map, distinctUntilChanged, share} = require('rxjs/operators');

const parsePad = pad => pad && ({
	axes: pad.axes,
	buttons: pad.buttons.map(button => ({
		pressed: button.pressed,
		value: button.value
	})),
	connected: pad.connected,
	id: pad.id,
	index: pad.index,
	mapping: pad.mapping,
	timestamp: pad.timestamp
}) || pad;

const list = () => Array.from(navigator.getGamepads() || navigator.webkitGetGamepads() || [])
	.map(parsePad);

const changes = () => time.frame().pipe(
	map(list),
	distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
	//	pads.reduce((r, pad) => !pad && r || (r + (pad.axes || '') + (pad.buttons || '')), '')
).pipe(share());

module.exports = {
	list,
	changes
};
