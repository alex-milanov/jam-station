'use strict';

// util
const midi = require('../util/midi')();
const viewport = require('./viewport');
const layout = require('./layout');
const clock = require('./clock');
const studio = require('./studio');
const audio = require('./audio');
const controls = require('./controls');
const assets = require('./assets');

const hook = ({state$, actions, tapTempo}) => {
	viewport.hook({state$, actions});
	layout.hook({state$, actions});
	clock.hook({state$, actions});
	studio.hook({state$, actions, tick$: clock.tick$});
	audio.hook({state$, midi, actions, studio, tapTempo, tick$: clock.tick$});
	assets.hook({state$, actions, studio});
	controls.hook({state$, actions});
};

module.exports = {
	hook
};
