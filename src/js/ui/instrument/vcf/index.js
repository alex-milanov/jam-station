'use strict';

const {
	div, h2, span, p, ul, li, hr, button, br, a,
	form, label, input, fieldset, legend, i, img,
	select, option
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
		// button('.drop-down.fa.fa-ellipsis-v'),
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
		div([
			label(`Type`),
			select({
				on: {change: ev => updateProp('type', ev.target.value)}
			}, [
				'lowpass', 'highpass'
				// 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'
			].map(type =>
				option({
					attrs: {
						value: type
					},
					props: {
						selected: effect.type === type
					}
				}, type)
			))
		]),
		div([
			label(`Cutoff`),
			span('.right', `${effect.cutoff}`),
			input('[type="range"]', {
				attrs: {min: 0, max: 1, step: 0.01},
				props: {value: effect.cutoff},
				on: {change: ev => updateProp('cutoff', parseFloat(ev.target.value))}
			})
		]),
		label(`Resonance`),
		span('.right', `${effect.resonance}`),
		input('[type="range"]', {
			attrs: {min: 0, max: 1, step: 0.01},
			props: {value: effect.resonance},
			on: {change: ev => updateProp('resonance', parseFloat(ev.target.value))}
		})
	]) : ''
]);
