'use strict';

const {
	div, h2, span, p, input, fieldset, legend, label, hr, button, i,
	ul, li, table, thead, tbody, tr, td, th, h, img, select, option,
	br
} = require('iblokz-snabbdom-helpers');

const moment = require('moment');
const fileUtil = require('../../util/file');

const openDialog = cb => {
	let fileEl = document.createElement('input');
	fileEl.setAttribute('type', 'file');
	fileEl.addEventListener('change', ev => {
		console.log(ev.target.files, this);
		cb(
			ev.target.files
		);
	});
	fileEl.dispatchEvent(new MouseEvent('click', {
		view: window,
		bubbles: true,
		cancelable: true
	}));
};

const actionMaps = [];

const optionList = (list, value, cb) => select({
	on: {
		change: ev => cb(ev)
	}
}, list.map(item =>
	option({
		attrs: {
			value: item
		},
		props: {
			selected: item === value
		}
	}, item)
));

module.exports = ({state, actions, params = {}}) => div('.midi-map', params, [
	div('.header', [
		h2([img('[src="assets/midi.svg"]'), span('MIDI Map')])
	]),
	div('.body', [].concat(
		fieldset([
			legend('Devices'),
			div('.devices', [
				h('dl', [
					h('dt', 'Inputs'),
					h('dd', ul(state.midiMap.devices.inputs.map((inp, index) =>
						li([
							inp.name,
							span('.right.fa.fa-code-fork'),
							input('.right[type="checkbox"]', {
								props: {
									checked: state.midiMap.data.in.indexOf(index) > -1
								},
								on: {
									click: () => actions.midiMap.toggleData('in', index)
								}
							}),
							span('.right.fa.fa-clock-o'),
							input('.right[type="checkbox"]', {
								props: {
									checked: state.midiMap.clock.in.indexOf(index) > -1
								},
								on: {
									click: () => actions.midiMap.toggleClock('in', index)
								}
							})
						])
					)))
				]),
				h('dl', [
					h('dt', 'Outputs'),
					h('dd', ul(state.midiMap.devices.outputs.map((outp, index) =>
						li([
							outp.name,
							span('.right.fa.fa-code-fork'),
							input('.right[type="checkbox"]', {
								props: {
									checked: state.midiMap.data.out.indexOf(index) > -1
								},
								on: {
									click: () => actions.midiMap.toggleData('out', index)
								}
							}),
							span('.right.fa.fa-clock-o'),
							input('.right[type="checkbox"]', {
								props: {
									checked: state.midiMap.clock.out.indexOf(index) > -1
								},
								on: {
									click: () => actions.midiMap.toggleClock('out', index)
								}
							})
						])
					)))
				])
			])
		]),
		fieldset([
			legend('Map'),
			button({
				on: {
					click: ev => fileUtil.save(moment().format('YYYY-MM-DD-hh-mm[-midiMap.json]'), state.midiMap.map)
				}
			}, 'Save Map'),
			button({
				on: {
					click: ev => openDialog(files =>
						fileUtil.load(files[0], 'json').subscribe(content => actions.set(['midiMap', 'map'], content))
					)
				}
			}, 'Load Map'),
			table([
				thead(tr([
					th('status'),
					th('key'),
					th('section'),
					th('prop'),
					th('min'),
					th('max'),
					th('dg')
				])),
				tbody(state.midiMap.map.map((mapping, index) =>
					tr([
						// status
						td(mapping[0]),
						// key
						td(
							input(`[type=number][value=${mapping[1]}][size=3]`, {
								on: {
									change: ev => actions.midiMap.modify([index, 1], ev.target.value)
								},
								style: {
									width: '38px'
								}
							})
						),
						// section
						td(
							optionList(['instrument', 'studio'], mapping[2][0],
								ev => actions.midiMap.modify([index, 2, 0], ev.target.value)
							)
						),
						// prop
						td(
							input(`[type=text][value=${mapping[2].slice(1).join(', ')}]`, {
								on: {
									change: ev => actions.midiMap.modify([index, 2], [].concat(
										mapping[2][0],
										ev.target.value.split(', ')
									))
								},
								style: {
									// width: '38px'
								}
							})),
						// min
						td(
							input(`[type=number][value=${mapping[3] || 0}][size=3]`, {
								on: {
									change: ev => actions.midiMap.modify([index, 3], ev.target.value)
								},
								style: {
									width: '38px'
								}
							})
						),
						// max
						td(
							input(`[type=number][value=${mapping[4] || 1}][size=3]`, {
								on: {
									change: ev => actions.midiMap.modify([index, 4], ev.target.value)
								},
								style: {
									width: '38px'
								}
							})
						),
						// digits
						td(mapping[5])
					])
				))
			])
		]),
		div([].concat(
			br(),
			div('.header', [
				h2([i('.fa.fa-hand-lizard-o'), ' Myo Armband']),
				button('.fa', {
					class: {
						'on': state.myo.on,
						'fa-toggle-on': state.myo.on,
						'fa-toggle-off': !state.myo.on
					},
					on: {click: () => actions.toggle(['myo', 'on'])}
				}),
				button('.fa.fa-arrows-v', {
					class: {
						on: state.myo.reverse
					},
					on: {click: () => actions.toggle(['myo', 'reverse'])}
				})
			]),
			state.myo.on ? table([
				thead([
					th('[width="30%"]', 'data'),
					th('[width="17%"]', 'x'),
					th('[width="17%"]', 'y'),
					th('[width="17%"]', 'z'),
					th('[width="17%"]', 'w')
				]),
				tbody([
					tr([
						td('accelerometer'),
						td('[align=right]', state.myo.osc.accelerometer && state.myo.osc.accelerometer[0].toFixed(2)),
						td('[align=right]', state.myo.osc.accelerometer && state.myo.osc.accelerometer[1].toFixed(2)),
						td('[align=right]', state.myo.osc.accelerometer && state.myo.osc.accelerometer[2].toFixed(2)),
						td()
					]),
					tr([
						td('gyroscope'),
						td('[align=right]', state.myo.osc.gyroscope && state.myo.osc.gyroscope[0].toFixed(2)),
						td('[align=right]', state.myo.osc.gyroscope && state.myo.osc.gyroscope[1].toFixed(2)),
						td('[align=right]', state.myo.osc.gyroscope && state.myo.osc.gyroscope[2].toFixed(2)),
						td()
					]),
					tr([
						td('orientation'),
						td('[align=right]', state.myo.osc.orientation && state.myo.osc.orientation.x.toFixed(2)),
						td('[align=right]', state.myo.osc.orientation && state.myo.osc.orientation.y.toFixed(2)),
						td('[align=right]', state.myo.osc.orientation && state.myo.osc.orientation.z.toFixed(2)),
						td('[align=right]', state.myo.osc.orientation && state.myo.osc.orientation.w.toFixed(2))
					])
				])
			]) : []
		))
	))
]);
