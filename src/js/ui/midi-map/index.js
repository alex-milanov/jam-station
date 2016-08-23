'use strict';

const {div, h2, span, p, input, fieldset, legend, label, hr, button} = require('../../util/vdom');

module.exports = ({state, actions}) => div('.midi-map', [
	div('.header', [
		h2('MIDI Map')
	]),
	div('.body', [
		fieldset([
			legend('Inputs')
		].concat(state.midi.inputs.map(inp =>
			p(inp.name)
		))),
		fieldset([
			legend('Outputs')
		].concat(state.midi.outputs.map(out =>
			p(out.name)
		)))
	])
]);
