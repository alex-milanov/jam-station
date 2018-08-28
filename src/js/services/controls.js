'use strict';

// gamepad
const gamepad = require('../util/gamepad');

const hook = ({state$, actions}) => {
	// gamepad
	gamepad.changes()
		// .withLatestFrom(pressedKeys$, (pads, keys) => ({pads, keys}))
		.subscribe(pads => {
			// console.log(pads[0]);
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
	document.addEventListener('keydown', ev => {
		// console.log(ev.code, ev.target.tagName, ev.target.contentEditable);

		if (ev.code === 'Escape') {
			ev.target.blur();
			window
				.getSelection()
				.removeAllRanges();
		}

		if (['INPUT', 'TEXTAREA'].indexOf(ev.target.tagName) > -1 || ev.target.contentEditable === true)
			return;

		// console.log(e);
		if (ev.code === 'Space') {
			actions.studio.play();
			ev.preventDefault();
		}
		if (ev.key === 'r') actions.studio.record();
		if (ev.key === 't') actions.studio.stop();
		// channels
		if (ev.key === 'Enter') actions.sequencer.add();
		if (ev.key === 'Delete' || ev.key === 'Backspace') actions.sequencer.clear();

		if (ev.key === 'ArrowUp') actions.sequencer.prev();
		if (ev.key === 'ArrowDown') actions.sequencer.next();

		if (ev.key === 'c') actions.pianoRoll.clear();
	});
};

module.exports = {
	hook
};
