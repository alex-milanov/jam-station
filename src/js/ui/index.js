'use strict';

const {obj, fn} = require('iblokz-data');
const {div, p, button, a, ul, li} = require('iblokz-snabbdom-helpers');
const {context} = require('iblokz-audio');
// components
const header = require('./header');
const layout = require('./layout');
const suspended = require('./suspended');
// panels
const mediaLibrary = require('./media-library');
const instrument = require('./instrument');
const session = require('./session');
const sequencer = require('./sequencer');
const midiMap = require('./midi-map');
const midiKeyboard = require('./midi-keyboard');
const pianoRoll = require('./piano-roll');

const panels = {
	mediaLibrary,
	instrument,
	session,
	sequencer,
	midiMap,
	midiKeyboard,
	pianoRoll
};

module.exports = ({state, actions, tapTempo}) => div('#ui',
	context.state === 'suspended'
	? suspended({state, actions})
	: [
		header({state, actions, tapTempo}),
		div('#content',
			layout({state, actions}, panels)
		)
	]
);
