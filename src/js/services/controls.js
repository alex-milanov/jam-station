'use strict';

// gamepad
const gamepad = require('../util/gamepad');

const hook = (state$, actions) => {
	// gamepad
	gamepad.changes()
		// .withLatestFrom(pressedKeys$, (pads, keys) => ({pads, keys}))
		.subscribe(pads => {
			console.log(pads[0]);
			if (pads[0]) {
				if (pads[0].buttons[8].pressed === true) actions.studio.play();
				if (pads[0].buttons[9].pressed === true) actions.studio.record();
				if (pads[0].buttons[3].pressed === true) actions.studio.stop();
				// channels
				if (pads[0].buttons[0].pressed === true) actions.sequencer.add();
				if (pads[0].buttons[2].pressed === true) actions.sequencer.clear();
				if (pads[0].buttons[1].pressed === true) actions.sequencer.remove();

				if (pads[0].axes[1] < 0) actions.sequencer.prev();
				if (pads[0].axes[1] > 0) actions.sequencer.next();
			}
		});

	// keyboard
	document.addEventListener('keydown', e => {
		console.log(e);
		if (e.code === 'Space') actions.studio.play();
		if (e.key === 'r') actions.studio.record();
		if (e.key === 't') actions.studio.stop();
		// channels
		if (e.key === 'Enter') actions.sequencer.add();
		if (e.key === 'Delete') actions.sequencer.clear();
		if (e.key === 'Backspace') actions.sequencer.remove();

		if (e.key === 'ArrowUp') actions.sequencer.prev();
		if (e.key === 'ArrowDown') actions.sequencer.next();
	});
};

module.exports = {
	hook
};
