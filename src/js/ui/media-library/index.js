'use strict';

const {
	div, h2, span, p, ul, li, hr, button,
	fieldset, legend, i
} = require('../../util/vdom');

module.exports = ({state, actions}) => div('.media-library', [
	div('.header', [
		h2('Media Library')
	]),
	div('.body', [
		fieldset([
			legend('Samples'),
			ul(state.channels.map(channel =>
				li([
					span(channel),
					button('.right.fa.fa-play')
				])
			))
		]),
		fieldset([
			legend('Instruments'),
			ul([li('BasicSynth')])
		])
	])
]);
