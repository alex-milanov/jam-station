'use strict';

const {div, h2, span, p, input, label, hr, button} = require('../../util/vdom');

module.exports = ({state, actions}) => div('.midi-map', [
	div('.header', [
		h2('MIDI Map')
	]),
	div('.body', [
		p('Inputs:'),
		p('Outputs:')
	])
]);
