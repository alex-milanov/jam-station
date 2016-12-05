'use strict';

const {
	div, h2, span, p, ul, li, hr, button,
	fieldset, legend, i
} = require('iblokz/adapters/vdom');

module.exports = ({state, actions}) => div('.media-library', [
	div('.header', [
		h2('Media Library')
	]),
	div('.body', [
		fieldset([
			legend('Samples'),
			ul(state.mediaLibrary.samples.map((sample, i) =>
				li({
					on: {click: () => actions.sequencer.setSample(state.sequencer.channel, i)}
				}, [
					span(sample),
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
