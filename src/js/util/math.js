'use strict';

const measureToBeatLength = measure => measure.split('/')
	.map(v => parseInt(v, 10))
	.reduce((p, v, i) => (i === 0) ? p * v : p / v, 16);

const bpmToTime = bpm => 60 / parseInt(bpm, 10) / 4;

module.exports = {
	measureToBeatLength,
	bpmToTime
};
