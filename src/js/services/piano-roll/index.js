// lib
// 3rd party
import {combineLatest, interval} from 'rxjs';
import {distinctUntilChanged, map, withLatestFrom, filter} from 'rxjs/operators';
import {v4 as uuid} from 'uuid';
// iblokz
import {obj, fn} from 'iblokz-data';
import * as audio from 'iblokz-audio';
import {canvas} from 'iblokz-gfx';

// util
// project utils
import {numberToNote, noteToNumber} from '~/util/midi';
import {patch, patchAt} from '~/util/data/object';
import {measureToBeatLength, bpmToTime} from '~/util/math';

// piano-roll utils
import {drawGrid, drawEvents, snapToGrid, prepCanvas} from './util/grid';
import {computeSelection, computeSelectionRect, findEventAtPosition} from './util/selection';

// Actions
const initial = {
	barsLength: 1,
	bar: 0,
	position: [0, 60],
	dim: [30, 12],
	tool: 'pointer', // pointer, pen, eraser
	selectionMode: 'containsRect', // 'containsRect' or 'intersects'
	interaction: {
		type: 'idle', // idle, selecting, moving, resizing
		start: null, // {x, y}
		last: null, // {x, y}
		current: null, // {x, y}
		anchorEventUuid: null, // UUID of the event being dragged (for multi-event dragging)
		anchorEventStart: null, // Original start position of anchor event when drag started
		originalEventPositions: null // Map of {uuid: {start, note}} for all selected events when drag started
	},
	selection: [],
	visible: [],
	events: []
};

/**
 * Prepares the time for the piano roll
 * @param {number} start - The start time
 * @param {number} end - The end time
 * @param {number} div - The division
 * @param {number} quantize - The quantize
 * @returns {number} The prepared time
 */
const prepTime = (start, end, div, quantize = 0.25) =>
	Math.round((end - start) / div / quantize) * quantize;

/**
 * Clears the piano roll events
 */
const clear = () => state => obj.patch(state, ['pianoRoll', 'events'], []);

/**
 * Records the piano roll events
 * @param {Object} pressed - The pressed keys
 * @param {Object} tick - The tick
 * @param {number} currentTime - The current time
 * @returns {Object} The new state
 */
const record = (pressed, tick, currentTime) => state =>
	fn.pipe(
		() => ({
			timeOffset: prepTime(tick.time, currentTime, bpmToTime(state.studio.bpm)),
			barStart: tick.tracks[state.session.selection.piano[0]]
				&& (tick.tracks[state.session.selection.piano[0]].bar * state.studio.beatLength) || 0,
			beatIndex: tick.tracks[state.session.selection.piano[0]]
				&& tick.tracks[state.session.selection.piano[0]].index || 0,
			bar: tick.tracks[state.session.selection.piano[0]]
				&& (tick.tracks[state.session.selection.piano[0]].bar) || 0,
			barsLength: state.pianoRoll.barsLength
		}),
		({timeOffset, barStart, beatIndex, barsLength, bar}) => obj.patch(state, 'pianoRoll', {
			events: [].concat(
				// already recorded events
				state.pianoRoll.events.filter(ev => ev.duration > 0),
				// still pressed
				state.pianoRoll.events.filter(ev => ev.duration === 0
						&& ev.startTime <= currentTime
						&& pressed[ev.note]),
				// unpressed
				state.pianoRoll.events.filter(ev => ev.duration === 0
					&& ev.startTime <= currentTime
					&& !pressed[ev.note]
				).map(ev => Object.assign(ev, {
					duration: prepTime(ev.startTime, currentTime, bpmToTime(state.studio.bpm))
				})),
				// new
				Object.keys(pressed)
					.filter(key => state.pianoRoll.events
						.filter(ev => ev.note === key
								&& ev.startTime <= currentTime
								&& ev.duration === 0)
						.length === 0
					)
					.map(note => ({note,
						start: (beatIndex === state.studio.beatLength - 1 && timeOffset > 0.95)
							? bar < barsLength - 1 ? barStart + state.studio.beatLength : 0
							: barStart + beatIndex + timeOffset,
						velocity: pressed[note],
						duration: 0,
						startTime: currentTime,
						uuid: uuid()
					}))
			)
		})
	)();


/**
 * Handles the pointer down event
 * @param {Object} {x, y} - The pointer coordinates
 * @returns {Object} The new state
 */
const pointerDown = ({x, y}) => state => {
	const {interaction, tool, visible, selection} = state.pianoRoll;
	
	// Check if clicking on a selected event (for moving)
	if (tool === 'pointer' && selection.length > 0) {
		const clickedEvent = findEventAtPosition(visible, {x, y});
		if (clickedEvent && selection.indexOf(clickedEvent.uuid) > -1) {
			// Check if not near edge (for Phase 3 - resizing)
			// For now, assume any click on selected event starts moving
			const edgeThreshold = 5; // pixels from edge
			const {rect} = clickedEvent;
			const nearLeftEdge = Math.abs(x - rect.x) < edgeThreshold;
			const nearRightEdge = Math.abs(x - (rect.x + rect.width)) < edgeThreshold;
			
			// If not near edge, start moving
			if (!nearLeftEdge && !nearRightEdge) {
				// Find the anchor event in the events array to get its original start position
				const anchorEvent = state.pianoRoll.events.find(e => e.uuid === clickedEvent.uuid);
				// Store original positions for all selected events to avoid accumulation during drag
				const originalEventPositions = state.pianoRoll.events
					.filter(e => selection.indexOf(e.uuid) > -1)
					.reduce((acc, event) => {
						acc[event.uuid] = {
							start: event.start,
							note: event.note
						};
						return acc;
					}, {});
				return patch(state, 'pianoRoll', {
					interaction: {
						...interaction,
						start: {x, y},
						current: {x, y},
						last: {x, y},
						type: 'moving',
						anchorEventUuid: clickedEvent.uuid, // Store the anchor event for snapping
						anchorEventStart: anchorEvent ? anchorEvent.start : null, // Store original start position
						originalEventPositions // Store all selected events' original positions
					}
				});
			}
		}
	}
	
	// Default: selecting or idle
	return patch(state, 'pianoRoll', {
		interaction: {
			...interaction,
			start: {x, y}, current: {x, y}, last: {x, y},
			type: tool === 'pointer' ? 'selecting' : 'idle'
		}
	});
};

/**
 * Handles the pointer move event
 * @param {Object} {x, y} - The pointer coordinates
 * @returns {Object} The new state
 */
const pointerMove = ({x, y}) => state => {
	if (state.pianoRoll.interaction.type === 'idle') {
		return state;
	}

	const {interaction, dim, selection, events} = state.pianoRoll;

	if (interaction.type === 'moving') {
		// Calculate total movement from start position (not incremental)
		const totalDeltaX = x - interaction.start.x;
		const totalDeltaY = y - interaction.start.y;
		
		// Convert total delta to grid steps
		const totalGridDeltaX = totalDeltaX / dim[0];
		const totalGridDeltaY = totalDeltaY / dim[1];
		
		// Find the anchor event (the one being dragged)
		const anchorEvent = events.find(e => e.uuid === interaction.anchorEventUuid);
		if (!anchorEvent || selection.indexOf(anchorEvent.uuid) === -1) {
			// Fallback to old behavior if anchor not found
			const gridDeltaX = Math.round(totalGridDeltaX);
			const gridDeltaY = Math.round(totalGridDeltaY);
			const updatedEvents = events.map(event => {
				if (selection.indexOf(event.uuid) === -1) return event;
				const newStart = Math.round(event.start + gridDeltaX);
				const newNoteNumber = noteToNumber(event.note) - gridDeltaY;
				const newNoteObj = numberToNote(newNoteNumber);
				const newNote = `${newNoteObj.key}${newNoteObj.octave}`;
				return {...event, start: newStart, note: newNote};
			});
			const snapped = snapToGrid(x, y, dim[0], dim[1]);
			return obj.patch(state, 'pianoRoll', {
				events: updatedEvents,
				interaction: {
					...interaction,
					current: {x, y},
					last: snapped
				}
			});
		}
		
		// Get anchor's original position from when drag started (use stored original, not current event)
		const originalPositions = interaction.originalEventPositions || {};
		const anchorOriginalPos = originalPositions[interaction.anchorEventUuid];
		const anchorOriginalStart = anchorOriginalPos 
			? anchorOriginalPos.start 
			: (interaction.anchorEventStart !== null ? interaction.anchorEventStart : anchorEvent.start);
		const anchorOriginalNote = anchorOriginalPos 
			? anchorOriginalPos.note 
			: anchorEvent.note;
		const anchorOriginalNoteNumber = noteToNumber(anchorOriginalNote);
		
		// Calculate the intended movement in grid steps (round to nearest integer for snapping)
		const roundedGridDeltaX = Math.round(totalGridDeltaX);
		const roundedGridDeltaY = Math.round(totalGridDeltaY);
		
		// Calculate the new position after movement
		const newAnchorStart = anchorOriginalStart + roundedGridDeltaX;
		const newAnchorNoteNumber = anchorOriginalNoteNumber - roundedGridDeltaY;
		
		// Snap the anchor to the nearest integer grid position
		const snappedAnchorStart = Math.round(newAnchorStart);
		const snappedAnchorNoteNumber = Math.round(newAnchorNoteNumber);
		const snappedAnchorNoteObj = numberToNote(snappedAnchorNoteNumber);
		const snappedAnchorNote = `${snappedAnchorNoteObj.key}${snappedAnchorNoteObj.octave}`;
		
		// Calculate the anchor's actual movement delta (snapped position - original position)
		// This preserves exact relative positions between events
		// Note: Events that were at integer positions may become non-integer if the delta is non-integer
		// Only the anchor event is guaranteed to be at an integer position after snapping
		const anchorDeltaStart = snappedAnchorStart - anchorOriginalStart;
		const anchorDeltaNoteNumber = snappedAnchorNoteNumber - anchorOriginalNoteNumber;
		
		// Update all selected events by applying the anchor's movement delta to their original positions
		const updatedEvents = events.map(event => {
			if (selection.indexOf(event.uuid) === -1) return event;
			
			// Special case: anchor event always snaps to grid (integer)
			if (event.uuid === interaction.anchorEventUuid) {
				return {
					...event,
					start: snappedAnchorStart,
					note: snappedAnchorNote
				};
			}
			
			// For other events: use original position + anchor's movement delta
			const originalPos = originalPositions[event.uuid];
			if (originalPos) {
				const newStart = originalPos.start + anchorDeltaStart;
				const newNoteNumber = noteToNumber(originalPos.note) + anchorDeltaNoteNumber;
				const newNoteObj = numberToNote(newNoteNumber);
				const newNote = `${newNoteObj.key}${newNoteObj.octave}`;
				return {...event, start: newStart, note: newNote};
			}
			
			// Fallback: if original position not stored, use current position + delta
			const newStart = event.start + anchorDeltaStart;
			const newNoteNumber = noteToNumber(event.note) + anchorDeltaNoteNumber;
			const newNoteObj = numberToNote(newNoteNumber);
			const newNote = `${newNoteObj.key}${newNoteObj.octave}`;
			return {...event, start: newStart, note: newNote};
		});
		
		// Snap last position to grid
		const snapped = snapToGrid(x, y, dim[0], dim[1]);
		
		return obj.patch(state, 'pianoRoll', {
			events: updatedEvents,
			interaction: {
				...interaction,
				current: {x, y},
				last: snapped
			}
		});
	}

	// For other interaction types (selecting), just update position
	return patch(state, 'pianoRoll', {
		interaction: {
			...interaction,
			current: {x, y}, last: interaction.current,
		}
	});
};

/**
 * Handles the pointer up event
 * @param {Object} {x, y} - The pointer coordinates
 * @returns {Object} The new state
 */
const pointerUp = ({x, y}) => state => {
	if (state.pianoRoll.interaction.type === 'idle') {
		return state;
	}

	const {interaction, visible, selectionMode} = state.pianoRoll;
	
	// Check if this was a click (no drag) or a drag
	const wasClick = interaction.start && 
		Math.abs(interaction.start.x - x) < 5 && 
		Math.abs(interaction.start.y - y) < 5;

	if (interaction.type === 'selecting') {
		if (wasClick) {
			// Single click selection
			const clickedEvent = findEventAtPosition(visible, {x, y});
			if (clickedEvent) {
				// Select the clicked event
				return obj.patch(state, 'pianoRoll', {
					interaction: {
						...initial.interaction
					},
					selection: [clickedEvent.uuid]
				});
			} else {
				// Deselect if clicking empty space
				return obj.patch(state, 'pianoRoll', {
					interaction: {
						...initial.interaction
					},
					selection: []
				});
			}
		} else {
			// Finalize selection from drag
			const selectionRect = computeSelectionRect(interaction.start, {x, y});
			const selection = computeSelection(visible, selectionRect, selectionMode);
			
			return obj.patch(state, 'pianoRoll', {
				interaction: {
					...initial.interaction
				},
				selection
			});
		}
	}

	if (interaction.type === 'moving') {
		// Finalize movement - events are already updated in pointerMove
		// Just reset interaction state
		return obj.patch(state, 'pianoRoll', {
			interaction: {
				...initial.interaction
			}
		});
	}

	// For other interaction types, just reset
	return obj.patch(state, 'pianoRoll', {
		interaction: {
			...initial.interaction
		}
	});
};

/**
 * The actions for the piano roll
 * @type {Object}
 */
export const actions = {
	initial,
	clear,
	record,
	pointerDown,
	pointerMove,
	pointerUp
};

// const notesPattern = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
// collect midi pressed keys
const prepPressed = (channels, track) => track.input.device > -1
	? channels[track.input.device] && channels[track.input.device][track.input.channel] || {}
	: Object.keys(channels)
		.reduce((cn, d) =>
			Object.keys(channels[d][track.input.channel] || {})
				.reduce((cn, note) =>
					obj.patch(cn, note, channels[d][track.input.channel][note] || cn[note]),
					cn
				),
			{}
		);

let subs = [];

export const hook = ({state$, actions}) => {
	subs = [];
	// Ensure pianoRoll html els exist before drawing
	const pianoRollEl$ = interval(500 /* ms */).pipe(
		map(() => document.querySelector('.piano-roll')),
		distinctUntilChanged((prev, curr) => prev === curr),
		filter(el => el),
		map(el => ({
			grid: el.querySelector('.piano-roll .grid'),
			events: el.querySelector('.piano-roll .events'),
			interaction: el.querySelector('.piano-roll .interaction')
		}))
	);

	// on grid changes redraw grid
	subs.push(
		combineLatest([
			state$.pipe(
				distinctUntilChanged((prev, curr) => {
					const prevPos = prev.pianoRoll.position;
					const currPos = curr.pianoRoll.position;
					return JSON.stringify(prevPos) === JSON.stringify(currPos);
				})
			),
			pianoRollEl$
		]).pipe(
			map(([state, el]) => ({state, el}))
		).subscribe(({el, state}) => {
			const gridCtx = el.grid.getContext('2d');
			const dim = [30, 12];
			drawGrid(gridCtx, dim, state.pianoRoll.position);
		})
	);

	// on event changes update event canvas
	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) => {
				const prevKey = JSON.stringify(prev.pianoRoll.position) +
					JSON.stringify(prev.studio.tick.tracks[prev.session.selection.piano[0]].bar) +
					JSON.stringify(prev.pianoRoll.events) +
					JSON.stringify(prev.pianoRoll.selection);
				const currKey = JSON.stringify(curr.pianoRoll.position) +
					JSON.stringify(curr.studio.tick.tracks[curr.session.selection.piano[0]].bar) +
					JSON.stringify(curr.pianoRoll.events) +
					JSON.stringify(curr.pianoRoll.selection);
				return prevKey === currKey;
			}),
			withLatestFrom(pianoRollEl$),
			map(([state, el]) => ({state, el}))
		).subscribe(({el, state}) => {
				const eventsCtx = el.events.getContext('2d');
				const dim = [30, 12];

				// slice of the current visible bar
				const bar = {
					start: state.studio.beatLength *
						((state.studio.tick.tracks[state.session.selection.piano[0]]
						&& state.studio.tick.tracks[state.session.selection.piano[0]].bar) || 0),
					end: state.studio.beatLength *
						(state.studio.tick.tracks[state.session.selection.piano[0]]
						&& (state.studio.tick.tracks[state.session.selection.piano[0]].bar + 1) || 1)
				};

				// collect events for the current bar
				const events = state.pianoRoll.events
					.filter(event => event.start >= bar.start && event.start < bar.end);
				

				const pos = state.pianoRoll.position;
				const rowCount = parseInt(eventsCtx.canvas.height / dim[1], 10);	
				const selection = state.pianoRoll.selection;

				const visible = events
					.filter(event => noteToNumber(event.note) <= pos[1]
						&& noteToNumber(event.note) > (pos[1] - rowCount))
					.map((event) =>
						({uuid: event.uuid, rect: {
							x: (event.start - bar.start + 1) * dim[0],
							y: (pos[1] - noteToNumber(event.note)) * dim[1],
							width: event.duration * dim[0], height: dim[1]
						}})
					)

				// Update visible array - always update when events change (positions, rects, etc.)
				// The distinctUntilChanged above already ensures we only run when events/position/bar change
				// So we should always update the visible array here to reflect current positions
				actions.set('pianoRoll', {visible});
				
				// Always render with current selection from state (even if visible didn't change)
				// This ensures selection changes are immediately reflected
				console.log('pianoRoll.events - drawing with selection:', selection, 'visible:', visible.map(v => v.uuid));
				drawEvents(eventsCtx, visible, selection, dim, bar, state.pianoRoll.position);
			})
		);

	// process interraction 
	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) => {
				return JSON.stringify(prev.pianoRoll.interaction) === JSON.stringify(curr.pianoRoll.interaction);
			}),
			withLatestFrom(pianoRollEl$),
			map(([state, el]) => ({state, el}))
		).subscribe(({state, el}) => {
				const ctx = el.interaction.getContext('2d');
				const {interaction, selectionMode} = state.pianoRoll;
				console.log(interaction);
				prepCanvas(ctx);
				if (interaction.type === 'selecting' && interaction.start && interaction.current) {
					// Compute visible events on the fly to ensure we have the latest
					const eventsCtx = el.events.getContext('2d');
					const dim = [30, 12];
					const bar = {
						start: state.studio.beatLength *
							((state.studio.tick.tracks[state.session.selection.piano[0]]
							&& state.studio.tick.tracks[state.session.selection.piano[0]].bar) || 0),
						end: state.studio.beatLength *
							(state.studio.tick.tracks[state.session.selection.piano[0]]
							&& (state.studio.tick.tracks[state.session.selection.piano[0]].bar + 1) || 1)
					};
					const events = state.pianoRoll.events
						.filter(event => event.start >= bar.start && event.start < bar.end);
					const pos = state.pianoRoll.position;
					const rowCount = parseInt(eventsCtx.canvas.height / dim[1], 10);
					const visible = events
						.filter(event => noteToNumber(event.note) <= pos[1]
							&& noteToNumber(event.note) > (pos[1] - rowCount))
						.map((event) =>
							({uuid: event.uuid, rect: {
								x: (event.start - bar.start + 1) * dim[0],
								y: (pos[1] - noteToNumber(event.note)) * dim[1],
								width: event.duration * dim[0], height: dim[1]
							}})
						);

					const selectionRect = computeSelectionRect(interaction.start, interaction.current);
					const selection = computeSelection(visible, selectionRect, selectionMode);
					console.log('[Interaction] Live selection during drag:', selection);
					// Don't set selection here - it will be set in pointerUp
					// This is just for visual feedback during drag

					canvas.rect(ctx, selectionRect, null, '#fff', [10, 10]);
				}

			})
		);

	// record action
	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) => {
				return JSON.stringify(prev.midiMap.channels) === JSON.stringify(curr.midiMap.channels);
			}),
			filter(state => state.studio.recording),
			map(state => ({
				state,
				pressed: prepPressed(
					state.midiMap.channels,
					state.session.tracks[state.session.selection.piano[0]]
				)
			}))
		)
			.subscribe(({state, pressed}) =>
				actions.pianoRoll.record(pressed, state.studio.tick, audio.context.currentTime))
	);

};

export let unhook = () => subs.forEach(sub => sub.unsubscribe());