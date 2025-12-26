'use strict';

const {
	div, h2, span, p, ul, li, hr, button, br,
	form, label, input, fieldset, legend, i, img
} = require('iblokz-snabbdom-helpers');

module.exports = ({effect, index, updateProp, toggleExpanded}) => fieldset({key: effect.id, attrs: {
	'data-id': effect.id
}}, [
	legend([
		span('.on', {
			on: {
				click: () => toggleExpanded()
			}
		}, [
			i(`.fa.${effect.expanded ? 'fa-minus-square-o' : 'fa-plus-square-o'}`),
			' ',
			effect.type.toUpperCase()
		]),
		div('.on-switch.fa', {
			on: {click: ev => updateProp('on', !effect.on)},
			class: {
				'fa-circle-thin': !effect.on,
				'on': effect.on,
				'fa-circle': effect.on
			}
		})
	]),
	effect.expanded ? div([
		label(`Seconds`),
		' ',
		// span('.right', `${state.instrument[name].seconds}`),
		input('[type="number"]', {
			attrs: {min: 1, max: 50, step: 0.01},
			props: {value: effect.seconds},
			on: {change: ev => updateProp('seconds', parseFloat(ev.target.value))}
		}),
		' ',
		label(`Decay`),
		// span('.right', `${state.instrument[name].decay}`),
		' ',
		input('[type="number"]', {
			attrs: {min: 0, max: 100, step: 0.01},
			props: {value: effect.decay},
			on: {change: ev => updateProp('decay', parseFloat(ev.target.value))}
		}),
		' ',
		/*
		label(`Reverse`),
		// span('.right', `${effect.reverse}`),
		' ',
		button('.fa', {
			class: {
				'fa-toggle-on': effect.reverse,
				'fa-toggle-off': !effect.reverse
			},
			on: {
				click: () => updateProp('reverse', !effect.reverse)
			}
		}),
		*/
		br(),
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
	]) : ''
]);
