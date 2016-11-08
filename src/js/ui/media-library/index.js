'use strict';

const {div, h2, span, p, ul, li, hr, button} = require('../../util/vdom');

module.exports = ({state, actions}) => div('.media-library', [
	div('.header', [
		h2('Media Library')
	]),
	div('.body', [
		p('Samples'),
		ul(state.channels.map(channel =>
			li([
				span(channel),
				button('.right.fa.fa-play')
			])
		)),
		p('Instruments'),
		ul([li('BasicSynth')])
	])
]);
