'use strict';

const {obj, fn} = require('iblokz-data');
const {distinctUntilChanged} = require('rxjs/operators');

// TODO: Replace with arr.patchAt from iblokz-data after it is updated
/**
 * Immutably patches an array at a given index.
 * @param {Array} arr - The source array
 * @param {number} index - The index to patch
 * @param {Object|Function} patch - The patch to apply
 * @returns {Array} A new array with the patch applied
 */
const arrPatchAt = (arr = [], index, patch) => [].concat(
	// if index is greater than 0, slice the array up to the index
	index > 0 ? arr.slice(0, index) : [],
	// if index is greater than the array length, fill the array with undefined up to the index
	arr.length - 1 < index ? new Array(index - arr.length).fill(undefined) : [],
	// if patch is a function, call it with the array at the index, otherwise apply the patch directly
	patch instanceof Function ? patch(arr[index] ?? {}) : Object.assign({}, arr[index], patch),
	// if index is less than the array length - 1, slice the array from the index + 1
	index < (arr.length - 1) ? arr.slice(index + 1) : []
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
	// piano-roll — sync only musical data to the measure, not UI state
	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) =>
				JSON.stringify({
					events: prev.pianoRoll && prev.pianoRoll.events,
					barsLength: prev.pianoRoll && prev.pianoRoll.barsLength
				}) === JSON.stringify({
					events: curr.pianoRoll && curr.pianoRoll.events,
					barsLength: curr.pianoRoll && curr.pianoRoll.barsLength
				})
			)
		).subscribe(state => (
				fn.pipe(([trackNumber, measureRow]) =>
					actions.set(['session', 'tracks'], arrPatchAt(
						state.session.tracks, trackNumber, {
							measures: arrPatchAt(
								state.session.tracks[trackNumber].measures,
								measureRow,
								measure => Object.assign({}, measure, {
									events: state.pianoRoll.events,
									barsLength: state.pianoRoll.barsLength
								})
							)
						}
					))
				)(state.session.selection.piano)
			))
	);
	// instrument - sync to track based on selection.instr
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
				))(state.session.selection.instr)
			))
	);

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	unhook
};
