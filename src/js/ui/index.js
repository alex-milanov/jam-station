'use strict';

const {obj, fn} = require('iblokz-data');
const {div, p, button, a, ul, li} = require('iblokz-snabbdom-helpers');
// components
const header = require('./header');
const layout = require('./layout');
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

module.exports = ({state, actions, tapTempo}) => div('#ui', [
	header({state, actions, tapTempo}),
	div('#content',
		layout({state, actions}, panels)
	)
]);
