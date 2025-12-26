'use strict';

const {
	div, h2, span, p, ul, li, hr, button, br, select, option,
	form, label, input, fieldset, legend, i, img
} = require('iblokz-snabbdom-helpers');

const types = [
	'sine',
	'square',
	'sawtooth',
	'triangle'
];

module.exports = ({effect, index, updateProp, toggleExpanded}) => fieldset({key: effect.id, attrs: {
	'data-id': effect.id
}}, [].concat(
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
		div(types.reduce((list, type) => list.concat([
			button(`.btn-opt`, {
				on: {
					click: ev => updateProp('type', type)
				},
				class: {on: (effect.type === type)}
			}, [img(`[src="assets/icons/wave-${type}.svg"]`)])
		]), [])),
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
		label(`Frequency`),
		span('.right', `${effect.frequency}`),
		input('[type="range"]', {
			attrs: {min: 0, max: 100, step: 0.05},
			props: {value: effect.frequency},
			on: {change: ev => updateProp('frequency', parseFloat(ev.target.value))}
		}),
		label(`Gain`),
		span('.right', `${effect.gain}`),
		input('[type="range"]', {
			attrs: {min: 0, max: 1000, step: 1},
			props: {value: effect.gain},
			on: {change: ev => updateProp('gain', parseFloat(ev.target.value))}
		}),
		div([
			label(`Target`),
			select({
				on: {change: ev => updateProp('target', ev.target.value)}
			}, [
				'volume', 'pitch'
			].map(target =>
				option({
					attrs: {
						value: target
					},
					props: {
						selected: effect.target === target
					}
				}, target)
				))
		])
	]) : []
));
