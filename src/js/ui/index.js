'use strict';

const {div} = require('iblokz-snabbdom-helpers');
const header = require('./header');
const mediaLibrary = require('./media-library');
const instrument = require('./instrument');
const sequencer = require('./sequencer');
const midiMap = require('./midi-map');
const midiKeyboard = require('./midi-keyboard');

module.exports = ({state, actions}) => div('#ui', [
	header({state, actions}),
	state.ui.mediaLibrary ? mediaLibrary({state, actions}) : '',
	state.ui.instrument ? instrument({state, actions}) : '',
	state.ui.sequencer ? sequencer({state, actions}) : '',
	state.ui.midiMap ? midiMap({state, actions}) : '',
	state.ui.midiKeyboard ? midiKeyboard({state, actions}) : ''
]);
