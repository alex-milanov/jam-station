'use strict';

const {
	div, img, h2, i, span, p, hr,
	ul, li, form, fieldset, label, input, button,
	select, option, legend
} = require('iblokz-snabbdom-helpers');

const loop = (times, fn = i => i) => (times > 0) && [].concat(loop(times - 1, fn), fn(times - 1)) || [];

const dropdown = ({opts, selected, cb}) => select({
	on: {
		change: ev => cb(ev)
	}
}, Object.keys(opts).sort().map(key =>
		option({
			attrs: {
				selected: String(key) === String(selected),
				value: key
			}
		}, opts[key])
	)
);

module.exports = ({state, actions, params = {}}) => div('.session', params, [
	div('.header', [
		h2([img('[src="assets/session.svg"][height="20"]', {style: {margin: '9px 7px 9px 0px'}}), span('Session')])
	]),
	div('.body', [].concat(
		state.session.tracks
			.map((track, trackIndex) => div('.channel', [
				ul('.track', [].concat(
					li(span(track.name)),
					loop(4).map(rowIndex =>
						li({
							class: {
								measure: (track.measures[rowIndex]),
								empty: !(track.measures[rowIndex]),
								selected: state.session.selection[track.type].join('.') === [trackIndex, rowIndex].join('.'),
								active: state.session.active[trackIndex] === rowIndex
							},
							on: {
								click: () => actions.session.select(trackIndex, rowIndex),
								dblclick: () => actions.session.activate(trackIndex, rowIndex)
							}
						}, span([
							(track.measures[rowIndex])
								? span(track.measures[rowIndex].name || 'untitled')
								: span('+'),
							state.session.active[trackIndex] === rowIndex
								? span(` [ ${state.studio.tick.tracks[trackIndex].bar || 0} ]`)
								: ''
						]))
					)
				)),
				fieldset('.midi', [
					legend('MIDI'),
					dropdown({
						opts: {
							'-1': 'All Devices',
							...state.midiMap.devices.inputs.reduce(
								(opts, inp, device) => ({...opts, [device]: inp.name}), {})
						},
						cb: ev => actions.session.updateTrackInput(trackIndex, 'device', Number(ev.target.value)),
						selected: track.input && track.input.device
					}),
					input(`[type=number]`, {on: {
						change: ev => actions.session.updateTrackInput(trackIndex, 'channel', ev.target.value)
					}, props: {
						value: track.input && track.input.channel || (track.type === 'seq' ? 10 : 1)
					}}),
					dropdown({
						opts: {
							'-1': 'None',
							...state.midiMap.devices.outputs.reduce(
								(opts, out, device) => ({...opts, [device]: out.name}), {})
						},
						cb: ev => actions.session.updateTrackOutput(trackIndex, 'device', Number(ev.target.value)),
						selected: track.output && track.output.device
					}),
					input(`[type=number]`, {on: {
						change: ev => actions.session.updateTrackOutput(trackIndex, 'channel', ev.target.value)
					}, props: {
						value: track.output && track.output.channel || (track.type === 'seq' ? 10 : 1)
					}})
				]),
				ul('.rack', [].concat(
					li(span([
						track.type === 'seq' ? 'Sequencer' : 'Synth'
					])),
					track.type === 'seq'
						? [
							li(span(`Reverb`)),
							li(span(`...`)),
							li(span(`...`)),
							li(span(`...`))
						]
						: [
							li(span(`VCF`)),
							li(span(`LFO`)),
							li(span(`Reverb`)),
							li(span(`...`))
						]
				))
			]))
	))
]);
