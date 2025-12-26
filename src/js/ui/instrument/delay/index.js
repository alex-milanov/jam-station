'use strict';

const {
	div, h2, span, p, ul, li, hr, button, br,
	form, label, input, fieldset, legend, i, img
} = require('iblokz-snabbdom-helpers');

module.exports = ({effect, index, updateProp, toggleExpanded}) => fieldset([
	legend([span('.on', effect.type.toUpperCase())]),
	div('.on-switch.fa', {
		on: {click: ev => updateProp('on', !effect.on)},
		class: {
			'fa-circle-thin': !effect.on,
			'on': effect.on,
			'fa-circle': effect.on
		}
	}),
	label(`Time`),
	span('.right', `${effect.time}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 3, step: 0.01},
		props: {value: effect.time},
		on: {change: ev => updateProp('time', parseFloat(ev.target.value))}
	}),
	label(`Dry`),
	span('.right', `${effect.dry}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 1, step: 0.01},
		props: {value: effect.dry},
		on: {change: ev => updateProp('dry', parseFloat(ev.target.value))}
	}),
	label(`Wet`),
	span('.right', `${effect.wet}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 1, step: 0.01},
		props: {value: effect.wet},
		on: {change: ev => updateProp('wet', parseFloat(ev.target.value))}
	})
	// label(`Gain`),
	// span('.right', `${effect.gain}`),
	// input('[type="range"]', {
	// 	attrs: {min: 0, max: 1, step: 0.005},
	// 	props: {value: effect.gain},
	// 	on: {change: ev => updateProp('gain', parseFloat(ev.target.value))}
	// })
]);
