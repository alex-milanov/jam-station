'use strict';

const measureToBeatLength = measure => measure.split('/')
	.map(v => parseInt(v, 10))
	.reduce((p, v, i) => (i === 0) ? p * v : p / v, 16);

const bpmToTime = bpm => 60 / parseInt(bpm, 10) / 4;

/**
 * Progress within the current cycle (0–1).
 * @param {number} startTime - Start time of the process (AudioContext time)
 * @param {number} currentTime - Current time (e.g. context.currentTime)
 * @param {number} cycleOffset - (0–1) fraction offset within the cycle at start
 * @param {number} bpm - BPM
 * @param {number} segments - Number of segments in the cycle (e.g. beatLength for one bar)
 * @param {number} modifier - Modifier of the cycle (default 1)
 * @returns {number} Progress 0–1 within current cycle
 */
const calculateProgress = (startTime, currentTime, cycleOffset, bpm, segments = 12, modifier = 1) =>
	(cycleOffset + (
		((currentTime - startTime) % (bpmToTime(bpm) * segments * modifier))
			/ (bpmToTime(bpm) * segments * modifier)
	)) % 1;

/**
 * Cycle (bar) index since start.
 * @param {number} startTime - Start time of the process
 * @param {number} currentTime - Current time
 * @param {number} cycleOffset - (0–1) fraction offset at start
 * @param {number} bpm - BPM
 * @param {number} segments - Segments per cycle (e.g. beatLength)
 * @param {number} modifier - Modifier (default 1)
 * @returns {number} Cycle index (bar index)
 */
const calculateCycle = (startTime, currentTime, cycleOffset, bpm, segments = 12, modifier = 1) =>
	Math.floor(
		cycleOffset + ((currentTime - startTime) / (bpmToTime(bpm) * segments * modifier))
	);

module.exports = {
	measureToBeatLength,
	bpmToTime,
	calculateProgress,
	calculateCycle
};
