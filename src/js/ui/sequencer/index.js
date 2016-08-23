'use strict';

const {div, h2, span, p, input, label, hr, button} = require('../../util/vdom');

const loop = (times, fn) => (times > 0) && [].concat(loop(times - 1, fn), fn(times - 1)) || [];

module.exports = ({state, actions}) => div('.sequencer', [
	div('.header', [
		h2('Sequencer'),
		button('.fa.fa-play', {
			class: {on: state.playing},
			on: {click: () => actions.studio.play()}
		}),
		button('.fa.fa-stop', {on: {click: () => actions.studio.stop()}}),
		label('BPM'),
		input('.bpm', {
			props: {value: state.bpm || 120, size: 6},
			on: {input: ev => actions.sequencer.change('bpm', ev.target.value)}
		}),
		label('MSR'),
		input('.measure', {
			props: {value: state.measure || '4/4', size: 6},
			on: {input: ev => actions.sequencer.change('measure', ev.target.value)}
		})
	]),
	div('.body', [
		div('.head', loop(state.beatLength, c =>
			div('.cell', {
				class: {
					tick: (state.tickIndex === c)
				}
			})
		))
	].concat(loop(4, r =>
		div(`.row`, [
			div('.instr', [span(state.channels[r])])
		].concat(loop(state.beatLength, c =>
			div(`.bar`, {
				class: {
					on: (state.pattern[r] && state.pattern[r][c] && state.tickIndex !== c),
					tick: (state.pattern[r] && state.pattern[r][c] && state.tickIndex === c)
				},
				on: {
					click: ev => actions.sequencer.toggle(r, c)
				}
			})))
		)))
	)
]);
