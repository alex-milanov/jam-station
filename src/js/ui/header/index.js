'use strict';

const {div, h1, header, img, i, ul, li, a, button, input} = require('iblokz/adapters/vdom');

module.exports = ({state, actions}) => header([
	ul([
		li([a({class: {on: state.ui.mediaLibrary}, on: {click: ev => actions.toggleUI('mediaLibrary')}}, 'Media Library')]),
		li([a({class: {on: state.ui.instrument}, on: {click: ev => actions.toggleUI('instrument')}}, 'Instrument')]),
		li([a({class: {on: state.ui.sequencer}, on: {click: ev => actions.toggleUI('sequencer')}}, 'Sequencer')]),
		li([a({class: {on: state.ui.midiMap}, on: {click: ev => actions.toggleUI('midiMap')}}, 'MIDI Map')])
	]),
	h1([
		img('[src="assets/logo.png"]'),
		'Jam Station'
	]),
	ul('.right', [
		li([
			a([i('.fa.fa-volume-down')]),
			input('[type="range"]'),
			a([i('.fa.fa-volume-up')])
		]),
		li([a([i('.fa.fa-save')])]),
		li([a([i('.fa.fa-upload')])]),
		li([a([i('.fa.fa-trash')])])
	])
]);
