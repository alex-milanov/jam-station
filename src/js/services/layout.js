'use strict';

const arr = require('iblokz/common/arr');

const loop = (times, fn) => (times > 0) && [].concat(loop(times - 1, fn), fn(times - 1)) || [];

const init = () => {};
const refresh = ({state, actions}) => {
	const ui = document.querySelector('#ui');
	const list = arr.fromList(ui.children);

	list.forEach((el, i) => {
		if (i > 0)
			el.style.left = list.filter((el, k) => k < i && k > 0)
				.reduce((w, el) => w + el.offsetWidth + 20, 0) + 20 + 'px';
	});
	// midiMap.style.left = sequencer.style.offsetWidth + 20 + 'px';
};

module.exports = {
	init,
	refresh
};
