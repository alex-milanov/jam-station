'use strict';

const time = require('../util/time');

const loop = (times, fn) => (times > 0) && [].concat(loop(times - 1, fn), fn(times - 1)) || [];

const refresh = ({layout, state, actions}) => {
	const list = Array.from(layout.children);

	const distance = 0;

	// console.log(list);

	list
		.filter(el => ['midi-keyboard', 'media-library'].indexOf(el.className) === -1)
		.map(el => ({el, i: list.indexOf(el)}))
		.forEach(({el, i}) => {
			if (i > 0)
				el.style.left = list[i - 1].offsetLeft + list[i - 1].offsetWidth + distance + 'px';
			else
				el.style.left = distance + 'px';
		});

	list.filter(el => el.className === 'midi-keyboard')
		.forEach(el => {
			const sequencer = document.querySelector('.sequencer');
			if (sequencer) {
				el.style.left = sequencer.style.left;
				el.style.top = 4 * distance + sequencer.offsetHeight + 'px';
			} else {
				el.style.left = '50%';
			}

			const keys = Array.from(el.querySelector('.keys').children);
			console.log(keys);

			const whiteKeysLength = keys.filter(key => key.className === 'white').length;

			keys.forEach((key, i) => {
				if (key.className === "white") {
					key.style.width = (100 / whiteKeysLength) + '%';
					if (i > 0 && keys[i - 1].className === 'black')
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
	time.frame()
		.map(() => document.querySelector('#layout'))
		.filter(layout => layout)
		.withLatestFrom(state$, (layout, state) => ({layout, state, actions}))
		.subscribe(refresh);
};

module.exports = {
	hook
};
