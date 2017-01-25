'use strict';

const arr = require('iblokz/common/arr');

const loop = (times, fn) => (times > 0) && [].concat(loop(times - 1, fn), fn(times - 1)) || [];

const init = () => {};
const refresh = ({state, actions}) => {
	const ui = document.querySelector('#ui');
	const list = arr.fromList(ui.children);

	const distance = 14;

	list.filter(el => el.className !== 'midi-keyboard').forEach((el, i) => {
		if (i > 0)
			el.style.left = list.filter((el, k) => k < i && k > 0)
				.reduce((w, el) => w + el.offsetWidth + distance, 0) + distance + 'px';
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

			const keys = arr.fromList(el.querySelector('.keys').children);
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

module.exports = {
	init,
	refresh
};
