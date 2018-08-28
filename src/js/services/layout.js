'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;

// const time = require('../util/time');

const loop = (times, fn) => (times > 0) && [].concat(loop(times - 1, fn), fn(times - 1)) || [];

const refresh = ({layout, state, actions}) => {
	const list = Array.from(layout.children);

	const distance = 10;

	// console.log(list);

	list
		.filter(el => ['midi-keyboard', 'media-library', 'piano-roll'].indexOf(el.className) === -1)
		.map(el => ({el, i: list.indexOf(el)}))
		.forEach(({el, i}) => {
			if (i > 0) {
				el.style.left = list[i - 1].offsetLeft + list[i - 1].offsetWidth + distance + 'px';
				el.style.top = distance + 'px';
			} else
				el.style.left = distance + 'px';
		});

	list.filter(el => el.className === 'piano-roll')
		.forEach(el => {
			const sequencer = document.querySelector('.sequencer');
			if (sequencer) {
				el.style.left = sequencer.style.left;
				el.style.top = sequencer.offsetTop + sequencer.offsetHeight + distance + 'px';
				el.style.width = sequencer.offsetWidth + 'px';
			} else {
				el.style.left = '50%';
			}
		});

	list.filter(el => el.className === 'midi-keyboard')
		.forEach(el => {
			const topPanel = document.querySelector('.piano-roll') || document.querySelector('.sequencer');
			if (topPanel) {
				el.style.left = topPanel.style.left;
				el.style.top = topPanel.offsetTop + topPanel.offsetHeight + distance + 'px';
				el.style.width = topPanel.offsetWidth + 'px';
			} else {
				el.style.left = '50%';
			}

			const keys = Array.from(el.querySelector('.keys').children);

			const whiteKeysLength = keys.filter(key => key.className.match('white')).length;

			keys.forEach((key, i) => {
				if (key.className.match('white')) {
					key.style.width = (99.9 / whiteKeysLength) + '%';
					if (i > 0 && keys[i - 1].className.match('black'))
						key.style.marginLeft = -(70 / whiteKeysLength / 2) + '%';
				} else {
					key.style.width = (70 / whiteKeysLength) + '%';
					if (i > 0)
						key.style.marginLeft = -(70 / whiteKeysLength / 2) + '%';
				}
			});
		});
	// midiMap.style.left = sequencer.style.offsetWidth + 20 + 'px';
};

const hook = ({state$, actions}) => {
	$.interval(100 /* ms */)
    .timeInterval()
		.map(() => document.querySelector('#layout'))
		.filter(layout => layout)
		.withLatestFrom(state$, (layout, state) => ({layout, state, actions}))
		.subscribe(refresh);
};

module.exports = {
	hook
};
