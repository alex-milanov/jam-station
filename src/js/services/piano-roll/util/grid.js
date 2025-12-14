import {numberToNote, noteToNumber} from '~/util/midi';
import {canvas, grid} from 'iblokz-gfx';
export const {snapToGrid} = grid;

/**
 * Converts pixel coordinates to grid position (piano-roll specific)
 * @param {number} x - X coordinate in pixels
 * @param {number} y - Y coordinate in pixels
 * @param {Array<number>} dim - Grid step size [stepX, stepY]
 * @param {Array<number>} position - Current view position [x, y] (y is note number)
 * @param {number} bar - Current bar index
 * @param {number} beatLength - Ticks per bar
 * @returns {Object} Grid position {gridX, gridY, note, time}
 */
export const pixelToGrid = (x, y, dim, position, bar, beatLength) => {
	// Subtract note column width (dim[0]) from x
	const gridX = Math.floor((x - dim[0]) / dim[0]);
	const gridY = Math.floor(y / dim[1]);
	const noteNumber = position[1] - gridY;
	const noteObj = numberToNote(noteNumber);
	const note = `${noteObj.key}${noteObj.octave}`; // Convert to string format like "C4"
	const time = bar * beatLength + gridX;
	
	return {gridX, gridY, note, time};
};

/**
 * Converts grid position to pixel coordinates (piano-roll specific)
 * @param {string} note - Note string (e.g., "C4", "D#5")
 * @param {number} time - Time position in ticks
 * @param {Array<number>} dim - Grid step size [stepX, stepY]
 * @param {Array<number>} position - Current view position [x, y] (y is note number)
 * @param {number} bar - Current bar index
 * @param {number} beatLength - Ticks per bar
 * @returns {Object} Pixel coordinates {x, y}
 */
export const gridToPixel = (note, time, dim, position, bar, beatLength) => {
	const noteNumber = noteToNumber(note);
	const gridY = position[1] - noteNumber;
	const gridX = time - (bar * beatLength);
	
	return {
		x: dim[0] + gridX * dim[0], // Add note column width
		y: gridY * dim[1]
	};
};

/**
 * Prepares the canvas for drawing
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
export const prepCanvas = ctx => (
	canvas.clear(ctx),
	canvas.refresh(ctx)
);

/**
 * Draws the grid on the canvas
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array<number>} dim - Grid step size [stepX, stepY]
 * @param {Array<number>} pos - Current view position [x, y] (y is note number)
 */
export const drawGrid = (ctx, dim = [42, 14], pos = [0, 60]) => {
	console.log('drawing grid');
	prepCanvas(ctx);
	const pattern = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
	const colCount = parseInt(ctx.canvas.width / dim[0], 10) + 1;
	const rowCount = parseInt(ctx.canvas.height / dim[1], 10);

	// draw rows
	for (let i = 0; i <= rowCount; i++) {
		// draw piano note
		canvas.rect(ctx, {x: 0, y: i * dim[1], width: dim[0], height: dim[1]},
			pattern[(pos[1] - i) % 12] ? '#1e1e1e' : '#ccc', '#555');
		// every octave draw C note + octave number
		if ((pos[1] - i) % 12 === 0) canvas.text(ctx, {
			x: 2,
			y: (i + 1) * dim[1] - 2,
			fillText: (({key, octave}) => `${key}${octave}`)(numberToNote(pos[1] - i)),
			fill: pattern[(pos[1] - i) % 12] ? '#ccc' : '#1e1e1e'
		});
		// draw line
		canvas.line(ctx, {x: dim[0], y: (i + 1) * dim[1]},
			{x: ctx.canvas.width, y: (i + 1) * dim[1]}, '#555');
	}
	// draw tick lines
	for (let i = 0; i < colCount; i++) {
		canvas.line(ctx, {x: i * dim[0], y: 0}, {x: i * dim[0], y: ctx.canvas.height}, '#555');
	}
};

/**
 * Draws the events on the canvas
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array<Object>} visible - Array of visible events
 * @param {Array<string>} selection - Array of selected event UUIDs
 * @param {Array<number>} dim - Grid step size [stepX, stepY]
 * @param {number} bar - Current bar index
 * @param {Array<number>} pos - Current view position [x, y] (y is note number)
 */
export const drawEvents = (ctx, visible, selection, dim = [42, 14], bar, pos = [0, 60]) => {
	console.log('drawing events');
	prepCanvas(ctx);
	visible.forEach(({uuid, rect}) =>
		canvas.rect(ctx, rect,
			...(selection.indexOf(uuid) > -1
				? ['#cfefdf', '#214d37']
				: ['#eee', '#555'])));
};
