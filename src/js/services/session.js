'use strict';

const {obj, fn} = require('iblokz-data');
const {distinctUntilChanged} = require('rxjs/operators');

const arrPatchAt = (arr, index, patch) => (
	// console.log(arr, index, patch),
	[].concat(
		arr.slice(0, index) || [],
		((arr.length - 1) < index)
			? new Array(index - arr.length).fill(undefined)
			: [],
		[Object.assign({}, arr[index], patch)],
		arr.slice(index + 1) || []
	)
);

let unhook = () => {};

const hook = ({state$, actions}) => {
	let subs = [];

	// on selection change update editors

	// on editor change update selected
	// sequencer
	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) => JSON.stringify(prev.sequencer) === JSON.stringify(curr.sequencer))
		).subscribe(state =>
				fn.pipe(([trackNumber, measureRow]) =>
					actions.set(['session', 'tracks'], arrPatchAt(
						state.session.tracks, trackNumber, {
							measures: arrPatchAt(
								state.session.tracks[trackNumber].measures,
								measureRow,
								state.sequencer
							)
						}
					))
				)(state.session.selection.seq)
			)
	);
	// piano-roll
	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) => JSON.stringify(prev.pianoRoll) === JSON.stringify(curr.pianoRoll))
		).subscribe(state => (
				fn.pipe(([trackNumber, measureRow]) =>
					actions.set(['session', 'tracks'], arrPatchAt(
						state.session.tracks, trackNumber, {
							measures: arrPatchAt(
								state.session.tracks[trackNumber].measures,
								measureRow,
								state.pianoRoll
							)
						}
					))
				)(state.session.selection.piano)
			))
	);
	// instrument
	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) => JSON.stringify(prev.instrument) === JSON.stringify(curr.instrument))
		).subscribe(state => (
				fn.pipe((([trackNumber, measureRow]) =>
					actions.set(['session', 'tracks'], arrPatchAt(
						state.session.tracks, trackNumber, Object.assign({},
							state.session.tracks[trackNumber] || {},
							{
								inst: state.instrument
							}
					)))
				))(state.session.selection.piano)
			))
	);

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	unhook
};
