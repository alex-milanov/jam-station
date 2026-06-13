import {context} from 'iblokz-audio';
import {calculateProgress, calculateCycle, bpmToTime} from './math';

export const MODIFIER = 1;

/**
 * Current 16th-note index within the bar (0 .. beatLength-1).
 */
export const stepIndex = (progress, beatLength) =>
	Math.min(beatLength - 1, Math.floor(progress * beatLength));

/**
 * Bar index within a looping pattern.
 */
export const barIndex = (cycle, barsLength) =>
	((cycle % barsLength) + barsLength) % barsLength;

/**
 * Derive transport position from studio anchors.
 * @param {Object} studio - studio slice of state
 * @param {Object} sequencer - sequencer slice
 * @param {Object} session - session slice
 * @param {number} [now] - AudioContext time
 */
export const derivePosition = (studio, sequencer, session, now = context.currentTime) => {
	const {startTime, cycleOffset, bpm, beatLength, playing, cycleBase = 0} = studio;
	const barsLength = sequencer.barsLength || 1;

	if (!playing || startTime === null) {
		return studio.tick;
	}

	const segments = beatLength;
	const progress = calculateProgress(startTime, now, cycleOffset, bpm, segments, MODIFIER);
	const cycle = calculateCycle(startTime, now, cycleOffset, bpm, segments, MODIFIER);
	const index = stepIndex(progress, beatLength);
	const bar = barIndex(cycle + cycleBase, barsLength);
	const elapsed = (cycle + cycleBase) * beatLength + index;

	const tracks = session.tracks.map((track, _i) => {
		const trackBarsLength = track.measures[session.active[_i]]
			&& track.measures[session.active[_i]].barsLength || 1;
		return {
			index,
			bar: barIndex(cycle + cycleBase, trackBarsLength)
		};
	});

	return {index, bar, elapsed, time: now, tracks};
};

/**
 * Absolute AudioContext time for a grid step.
 */
export const absoluteStepTime = (startTime, cycleOffset, bpm, beatLength, cycle, step) => {
	const stepDuration = bpmToTime(bpm) * MODIFIER;
	const cycleStart = startTime
		- cycleOffset * beatLength * stepDuration
		+ cycle * beatLength * stepDuration;
	return cycleStart + step * stepDuration;
};

/**
 * Re-anchor transport when tempo or time signature changes mid-play.
 */
export const reanchor = (studio, now = context.currentTime) => {
	const {startTime, cycleOffset, bpm, beatLength} = studio;
	return {
		startTime: now,
		cycleOffset: calculateProgress(
			startTime, now, cycleOffset, bpm, beatLength, MODIFIER
		)
	};
};

export const stepTimeOffset = (progress, beatLength, quantize = 0.25) => {
	const idx = stepIndex(progress, beatLength);
	const fractional = progress * beatLength - idx;
	return Math.round(fractional / quantize) * quantize;
};

export default {
	MODIFIER,
	stepIndex,
	stepTimeOffset,
	barIndex,
	derivePosition,
	absoluteStepTime,
	reanchor
};
