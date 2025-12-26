import { div, span, label, input, fieldset, legend, img, button } from 'iblokz-snabbdom-helpers';

export const types = [
	'sine',
	'square',
	'sawtooth',
	'triangle'
];

export default ({name, prefs, updateProp}) => fieldset([
	legend([
		span('.on', name.toUpperCase()),
		div(types.reduce((list, type) => list.concat([
			button(`.btn-opt`, {
				on: {
					click: ev => updateProp('type', type)
				},
				class: {on: (prefs.type === type)}
			}, [img(`[src="assets/icons/wave-${type}.svg"]`)])
		]), [])),
		div('.on-switch.fa', {
			on: {click: ev => updateProp('on', !prefs.on)},
			class: {
				'fa-circle-thin': !prefs.on,
				'on': prefs.on,
				'fa-circle': prefs.on
			}
		}),
		img('[src="assets/tuning-fork.png"]'),
		div('.knob', {
			style: {
				transform: `rotate(${prefs.detune / 100 * 135}deg)`
			},
			on: {
				wheel: ev => (
					ev.preventDefault(),
					updateProp('detune', prefs.detune - ev.deltaY / 53)
				)
			}
		}),
		input('[size="3"][type="number"]', {
			props: {value: prefs.detune},
			on: {input: ev => updateProp('detune', ev.target.value)}
		})
	])
]);
