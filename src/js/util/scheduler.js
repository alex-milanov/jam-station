import {bpmToTime} from './math';

/**
 * Returns an array of absolute AudioContext times for each step in a window.
 * @param {number} startTime - Start time (AudioContext time) for the first step
 * @param {number} bpm - BPM
 * @param {number} length - Number of steps (e.g. beatLength for one bar)
 * @param {number} resolution - Steps per quarter note (4 = 16ths)
 * @return {number[]} Array of times, one per step
 */
export const projection = (startTime, bpm, length, resolution) =>
	new Array(length).fill(null).map((_, index) =>
		startTime + (bpmToTime(bpm) * 4 / resolution) * index
	);

export default {
	projection
};
