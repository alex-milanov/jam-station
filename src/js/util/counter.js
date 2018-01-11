'use strict';

// [12, 1] tones -> octave
// [4, 4, 1] tick -> beat -> measure
const iterate = (position = [], intervals = [], steps = 1, direction = 1) =>
	intervals.reduce(({pos, div}, interval, index) => {
		div *= interval;
		pos[index] = (pos[index] || 0) + direction * ((interval === 1)
      ? parseInt(steps / div, 10)
      : steps % div);
		return {pos, div};
	}, {pos: position, div: 1}).pos;

const walk = (position = [], intervals = []) =>
	intervals.reduce(
		(steps, multiplier, index) =>
			(steps + ((intervals[index - 1] || 1) * position[index])),
		0
	);

console.log(iterate([3, 1], [12, 1], 14, -1));
console.log(walk([3, 1], [12, 1]));

module.exports = {
	iterate
};
