import {fn} from 'iblokz-data';
import {combineLatest} from 'rxjs';
import {filter, map, withLatestFrom, distinctUntilChanged} from 'rxjs/operators';
import * as a from 'iblokz-audio';
import {sampler} from 'iblokz-audio';

import * as m from '~/util/midi';
import * as time from '~/util/time';
import {projection} from '~/util/scheduler';
import {bpmToTime, calculateProgress, calculateCycle} from '~/util/math';
import {barIndex, MODIFIER} from '~/util/position';
import pocket from '~/util/pocket';
import * as audio from '../audio';

let latestScheduledCycle = -1;
let scheduling = false;
const scheduledEventUuids = new Set();

export const resetScheduleState = () => {
	latestScheduledCycle = -1;
	scheduling = false;
	scheduledEventUuids.clear();
};

const buildPayload = (state, sampleBank, engine) => {
	const {startTime, cycleOffset, bpm, beatLength, cycleBase = 0} = state.studio;
	const barsLength = state.sequencer.barsLength || 1;
	const segments = beatLength;
	return {
		state, sampleBank, engine,
		startTime, cycleOffset, bpm, beatLength, barsLength, cycleBase,
		cycle: calculateCycle(
			startTime, a.context.currentTime, cycleOffset, bpm, segments, MODIFIER
		),
		progress: calculateProgress(
			startTime, a.context.currentTime, cycleOffset, bpm, segments, MODIFIER
		)
	};
};

const dispatchSeqStep = ({
	track, ch, step, patternBar, timepos, bpm, sequencer, mediaLibrary, sampleBank, engine, instrument, midiMap
}) => {
	const pattern = sequencer.pattern[patternBar];
	if (!pattern) return;

	pattern.forEach((row, k) => {
		if (!row || !row[step]) return;

		if (track.output.device !== -1) {
			const note = fn.pipe(
				() => m.numberToNote(60 + k),
				({key, octave}) => `${key}${octave}`
			)();
			const stepDur = bpmToTime(bpm);
			audio.sendMIDImsg(
				midiMap.devices.outputs[track.output.device],
				note, row[step], timepos, track.output.channel
			);
			audio.sendMIDImsg(
				midiMap.devices.outputs[track.output.device],
				note, 0, timepos + stepDur / 4, track.output.channel
			);
		} else {
			const sampleId = mediaLibrary.files[sequencer.channels[k]];
			if (!sampleBank[sampleId]) return;
			const firstEffectNode = audio.getFirstEffectNode(engine, track.inst || {}, ch);
			let inst = sampler.clone(sampleBank[sampleId], {gain: row[step]});
			inst = a.connect(inst, firstEffectNode);
			a.start(inst, timepos);
			audio.pushBuffer(inst);
		}
	});
};

const dispatchPianoBar = ({
	track, ch, patternBar, beatLength, startSegment, segmentCount,
	scheduleStart, bpm, session, instrument, midiMap, onlyNew = false,
	cycleStartTime = null
}) => {
	const measure = track.measures[session.active[ch]];
	if (!measure || !measure.events) return;

	const barStart = beatLength * patternBar;
	const barEnd = barStart + beatLength;
	const stepDuration = bpmToTime(bpm);
	const scheduleFrom = barStart + startSegment;

	measure.events
		.filter(event => event.duration > 0)
		.forEach(event => {
			if (onlyNew && event.uuid && scheduledEventUuids.has(event.uuid)) return;

			let timepos;
			if (onlyNew && cycleStartTime != null) {
				// Align to transport step on the target cycle (same column next bar)
				const stepInBar = ((event.start % beatLength) + beatLength) % beatLength;
				timepos = cycleStartTime + stepInBar * stepDuration;
			} else if (event.start >= scheduleFrom && event.start < barEnd) {
				timepos = scheduleStart + (event.start - scheduleFrom) * stepDuration;
			} else {
				return;
			}

			if (timepos < a.context.currentTime - 0.05) return;

			if (event.uuid) scheduledEventUuids.add(event.uuid);

			const inst = Object.assign({}, instrument, track.inst);
			const noteOffTime = timepos + event.duration * stepDuration;
			if (track.output && track.output.device > -1) {
				audio.sendMIDImsg(
					midiMap.devices.outputs[track.output.device],
					event.note, event.velocity || 1, timepos, track.output.channel
				);
				audio.noteOn(inst, ch, event.note, event.velocity || 0.7, timepos, true);
				audio.sendMIDImsg(
					midiMap.devices.outputs[track.output.device],
					event.note, 0, noteOffTime, track.output.channel
				);
				audio.noteOff(inst, ch, event.note, noteOffTime, true);
			} else {
				audio.noteOn(inst, ch, event.note, event.velocity || 0.7, timepos);
				audio.noteOff(inst, ch, event.note, noteOffTime);
			}
		});
};

const schedulePianoCycle = (payload, targetCycle, {startPrc = 0, onlyNew = false} = {}) => {
	const {
		startTime, cycleOffset, bpm, beatLength, cycleBase, state
	} = payload;
	const segmentCount = startPrc > 0
		? (beatLength - Math.ceil(beatLength * startPrc))
		: beatLength;
	const startSegment = beatLength - segmentCount;
	const stepDuration = bpmToTime(bpm);
	const cycleStart = startTime
		- cycleOffset * beatLength * stepDuration
		+ targetCycle * beatLength * stepDuration;
	const scheduleStart = cycleStart + (startPrc > 0 ? startSegment * stepDuration : 0);
	const {session, instrument, midiMap} = state;

	session.tracks.forEach((track, ch) => {
		if (track.type !== 'piano') return;
		const trackBarsLength = parseInt(
			track.measures[session.active[ch]] && track.measures[session.active[ch]].barsLength || 1,
			10
		);
		const pianoBar = barIndex(targetCycle + cycleBase, trackBarsLength);
		dispatchPianoBar({
			track, ch, patternBar: pianoBar, beatLength, startSegment, segmentCount,
			scheduleStart, bpm, session, instrument, midiMap, onlyNew,
			cycleStartTime: onlyNew ? cycleStart : null
		});
	});
};

const scheduleBar = (payload) => {
	const {
		cycle, startTime, cycleOffset, bpm, beatLength, barsLength, cycleBase, startPrc,
		state, sampleBank, engine
	} = payload;

	latestScheduledCycle = cycle;
	const segmentCount = startPrc > 0
		? (beatLength - Math.ceil(beatLength * startPrc))
		: beatLength;
	const startSegment = beatLength - segmentCount;
	const stepDuration = bpmToTime(bpm);

	const cycleStart = startTime
		- cycleOffset * beatLength * stepDuration
		+ cycle * beatLength * stepDuration;
	const partialCycleOffset = startPrc > 0 ? startSegment * stepDuration : 0;
	const scheduleStart = cycleStart + partialCycleOffset;
	const patternBar = barIndex(cycle + cycleBase, barsLength);

	const {session, sequencer, mediaLibrary, instrument, midiMap} = state;

	session.tracks.forEach((track, ch) => {
		if (track.type === 'seq') {
			const times = projection(scheduleStart, bpm, segmentCount, 4);
			times.forEach((timepos, index) => {
				if (startPrc > 0 && index === 0) return;
				const step = startSegment + index;
				dispatchSeqStep({
					track, ch, step, patternBar, timepos, bpm,
					sequencer, mediaLibrary, sampleBank, engine, instrument, midiMap
				});
			});
		} else if (track.type === 'piano') {
			const trackBarsLength = parseInt(
				track.measures[session.active[ch]] && track.measures[session.active[ch]].barsLength || 1,
				10
			);
			const pianoBar = barIndex(cycle + cycleBase, trackBarsLength);
			dispatchPianoBar({
				track, ch, patternBar: pianoBar, beatLength, startSegment, segmentCount,
				scheduleStart, bpm, session, instrument, midiMap, onlyNew: false
			});
		}
	});

	scheduling = false;
};

let subs = [];

export const hook = ({state$, actions}) => {
	subs = [];
	const sampleBank$ = pocket.stream.pipe(
		filter(p => p.sampleBank),
		distinctUntilChanged((prev, curr) => prev.sampleBank === curr.sampleBank),
		map(p => p.sampleBank)
	);

	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) => prev.studio.playing === curr.studio.playing)
		).subscribe(state => {
			if (state.studio.playing) {
				resetScheduleState();
			} else {
				audio.clearBuffer();
				resetScheduleState();
			}
		})
	);

	subs.push(
		state$.pipe(
			filter(state => state.studio.playing),
			distinctUntilChanged((prev, curr) =>
				prev.studio.bpm === curr.studio.bpm
				&& prev.studio.beatLength === curr.studio.beatLength
				&& prev.studio.measure === curr.studio.measure
			)
		).subscribe(() => {
			audio.clearBuffer();
			resetScheduleState();
		})
	);

	subs.push(
		state$.pipe(
			filter(state => state.studio.playing && state.studio.startTime != null),
			distinctUntilChanged((prev, curr) => {
				const completed = events => (events || [])
					.filter(e => e.duration > 0)
					.map(e => `${e.uuid}:${e.start}:${e.duration}:${e.note}`);
				return JSON.stringify(completed(prev.pianoRoll && prev.pianoRoll.events))
					=== JSON.stringify(completed(curr.pianoRoll && curr.pianoRoll.events));
			})
		).subscribe(state => {
			const payload = buildPayload(state, null, null);
			schedulePianoCycle(payload, payload.cycle + 1, {onlyNew: true});
		})
	);

	subs.push(
		time.frame().pipe(
			withLatestFrom(
				combineLatest([state$, sampleBank$, audio.engine$]),
				(t, combined) => combined
			),
			filter(([state]) => state.studio.playing && state.studio.startTime != null),
			map(([state, sampleBank, engine]) => buildPayload(state, sampleBank, engine))
		).subscribe(payload => {
			if (scheduling) return;

			const {cycle, progress, cycleOffset} = payload;

			if (cycle === 0 && latestScheduledCycle === -1 && cycleOffset === 0) {
				scheduling = true;
				scheduleBar(Object.assign({}, payload, {cycle, startPrc: 0}));
			} else if (latestScheduledCycle === cycle - 1) {
				scheduling = true;
				scheduleBar(Object.assign({}, payload, {cycle, startPrc: progress}));
			} else if (cycle === latestScheduledCycle && progress > 0.7) {
				scheduling = true;
				scheduleBar(Object.assign({}, payload, {cycle: cycle + 1, startPrc: 0}));
			}
		})
	);
};

export let unhook = () => subs.forEach(sub => sub.unsubscribe());

export default {
	hook,
	unhook
};
