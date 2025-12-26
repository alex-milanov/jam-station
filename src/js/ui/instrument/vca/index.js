import { div, span, label, input } from 'iblokz-snabbdom-helpers';

export default ({prefs, updateProp}) => [
	div('.vertical', [
		label(`ATT`),
		span('.right', `${prefs.attack}`),
		input('[type="range"]', {
			attrs: {min: 0, max: 1, step: 0.01},
			props: {value: prefs.attack},
			on: {change: ev => updateProp('attack', parseFloat(ev.target.value))}
		}),
		label(`DEC`),
		span('.right', `${prefs.decay}`),
		input('[type="range"]', {
			attrs: {min: 0, max: 1, step: 0.01},
			props: {value: prefs.decay},
			on: {change: ev => updateProp('decay', parseFloat(ev.target.value))}
		}),
		label(`SUS`),
		span('.right', `${prefs.sustain}`),
		input('[type="range"]', {
			attrs: {min: 0, max: 1, step: 0.01},
			props: {value: prefs.sustain},
			on: {change: ev => updateProp('sustain', parseFloat(ev.target.value))}
		}),
		label(`REL`),
		span('.right', `${prefs.release}`),
		input('[type="range"]', {
			attrs: {min: 0, max: 1, step: 0.01},
			props: {value: prefs.release},
			on: {change: ev => updateProp('release', parseFloat(ev.target.value))}
		})
	]),
	div([
		label(`Volume`),
		span('.right', `${prefs.volume}`),
		input('[type="range"]', {
			attrs: {min: 0, max: 1, step: 0.01},
			props: {value: prefs.volume},
			on: {change: ev => updateProp('volume', parseFloat(ev.target.value))}
		})
	])
];
