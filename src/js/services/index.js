'use strict';

// util
const viewport = require('./viewport');
const layout = require('./layout');
const clock = require('./clock');
const studio = require('./studio');
const audio = require('./audio');
const midi = require('./midi');
const controls = require('./controls');
const assets = require('./assets');
const pianoRoll = require('./piano-roll');

const hook = ({state$, actions, tapTempo}) => {
	viewport.hook({state$, actions});
	layout.hook({state$, actions});
	clock.hook({state$, actions});
	studio.hook({state$, actions});
	midi.hook({state$, actions, tapTempo});
	audio.hook({state$, actions, studio, tapTempo});
	assets.hook({state$, actions, studio});
	controls.hook({state$, actions});
	pianoRoll.hook({state$, actions});
};

module.exports = {
	hook
};
