'use strict';

const {div, h1, header, i} = require('../util/vdom');
const mediaLibrary = require('./media-library');
const instrument = require('./instrument');
const sequencer = require('./sequencer');
const midiMap = require('./midi-map');

module.exports = ({state, actions}) => div('#ui', [
	header([h1([i('.fa.fa-music'), ' Jam Station'])]),
	mediaLibrary({state, actions}),
	instrument({state, actions}),
	sequencer({state, actions}),
	midiMap({state, actions})
]);
