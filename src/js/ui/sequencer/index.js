'use strict';

const {div, h2, span, p, input, label, hr, button} = require('iblokz/adapters/vdom');

const loop = (times, fn) => (times > 0) && [].concat(loop(times - 1, fn), fn(times - 1)) || [];

module.exports = ({state, actions}) => div('.sequencer', [
	div('.header', [
		h2('Sequencer'),
		button('.fa.fa-play', {
			class: {on: state.studio.playing},
			on: {click: () => actions.studio.play()}
		}),
		button('.fa.fa-stop', {on: {click: () => actions.studio.stop()}}),
		label('BPM'),
		input('.bpm', {
			props: {value: state.studio.bpm || 120, size: 6},
			on: {input: ev => actions.studio.change('bpm', ev.target.value)}
		}),
		label('MSR'),
		input('.measure', {
			props: {value: state.studio.measure || '4/4', size: 6},
			on: {input: ev => actions.studio.change('measure', ev.target.value)}
		})
	]),
	div('.body', [
		div('.head', loop(state.studio.beatLength, c =>
			div('.cell', {
				class: {
					tick: (state.studio.tickIndex === c)
				}
			})
		))
	].concat(loop(4, r =>
		div(`.row`, [
			div('.instr', [span(state.channels[r])])
		].concat(loop(state.studio.beatLength, c =>
			div(`.bar`, {
				class: {
					on: (state.pattern[r] && state.pattern[r][c] && state.studio.tickIndex !== c),
					tick: (state.pattern[r] && state.pattern[r][c] && state.studio.tickIndex === c)
				},
				on: {
					click: ev => actions.sequencer.toggle(r, c)
				}
			})))
		)))
	)
]);
