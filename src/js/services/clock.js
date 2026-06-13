'use strict';

/**
 * Legacy clock service — MIDI clock output is handled in midi.js via time.frame().
 * Kept as a no-op hook for compatibility.
 */
const hook = () => () => {};

module.exports = {
	hook,
	unhook: () => {}
};
