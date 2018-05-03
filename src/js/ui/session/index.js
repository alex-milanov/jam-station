'use strict';

const {
	div, img, h2, i, span, p, input, label, hr, button,
	ul, li
} = require('iblokz-snabbdom-helpers');

module.exports = ({state, actions, params = {}}) => div('.session', params, [
	div('.header', [
		h2([img('[src="assets/session.svg"][height="20"]', {style: {margin: '9px 7px 9px 0px'}}), span('Session')])
	]),
	div('.body', [].concat(
		state.session.tracks
			.map((track, trackIndex) =>
				ul('.track', [].concat(
					li(span(track.name)),
					state.session.rows.map((row, rowIndex) =>
						li({
							class: {
								measure: (track.measures[rowIndex]),
								empty: !(track.measures[rowIndex]),
								selected: state.session.selection[track.type].join('.') === [trackIndex, rowIndex].join('.')
							},
							on: {
								click: () => actions.session.select(track.type, trackIndex, rowIndex),
								dblclick: () => actions.session.activate(trackIndex, rowIndex)
							}
						}, span(
							(track.measures[rowIndex])
								? span(track.measures[rowIndex].name || 'untitled')
								: span('+')
						))
					)
			))
		)
	))
]);
