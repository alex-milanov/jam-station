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

module.exports = ({name, state, actions}) => fieldset([].concat(
	legend([
		span('.on', {
			on: {
				click: () => actions.toggle(['instrument', 'lfo', 'expanded'])
			}
		}, [
			i(`.fa.${state.instrument.lfo.expanded ? 'fa-minus-square-o' : 'fa-plus-square-o'}`),
			' ',
			name.toUpperCase()
		]),
		div(types.reduce((list, type) => list.concat([
			button(`.btn-opt`, {
				on: {
					click: ev => actions.instrument.updateProp(name, 'type', type)
				},
				class: {on: (state.instrument[name].type === type)}
			}, [img(`[src="assets/icons/wave-${type}.svg"]`)])
		]), []))
	]),
	div('.on-switch.fa', {
		on: {click: ev => actions.instrument.updateProp(name, 'on', !state.instrument[name].on)},
		class: {
			'fa-circle-thin': !state.instrument[name].on,
			'on': state.instrument[name].on,
			'fa-circle': state.instrument[name].on
		}
	}),
	state.instrument.lfo.expanded ? div([
		label(`Frequency`),
		span('.right', `${state.instrument[name].frequency}`),
		input('[type="range"]', {
			attrs: {min: 0, max: 100, step: 0.05},
			props: {value: state.instrument[name].frequency},
			on: {change: ev => actions.instrument.updateProp(name, 'frequency', parseFloat(ev.target.value))}
		}),
		label(`Gain`),
		span('.right', `${state.instrument[name].gain}`),
		input('[type="range"]', {
			attrs: {min: 0, max: 1000, step: 1},
			props: {value: state.instrument[name].gain},
			on: {change: ev => actions.instrument.updateProp(name, 'gain', parseFloat(ev.target.value))}
		}),
		div([
			label(`Target`),
			select({
				on: {change: ev => actions.instrument.updateProp(name, 'target', ev.target.value)}
			}, [
				'volume', 'pitch'
			].map(target =>
				option({
					attrs: {
						value: target
					},
					props: {
						selected: state.instrument.lfo.target === target
					}
				}, target)
				))
		])
	]) : []
));
