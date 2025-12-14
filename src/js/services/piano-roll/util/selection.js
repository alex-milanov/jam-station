
import {rect} from 'iblokz-gfx';
const {containsRect, intersects, fromVectors, containsVector} = rect;

/**
 * Computes which items are selected based on a selection rectangle
 * @param {Array} visible - Array of items with {uuid/id, rect}
 * @param {Object} selectionRect - Selection rectangle {x, y, width, height}
 * @param {string} mode - Selection mode: 'containsRect' or 'intersects'
 * @returns {Array} Array of selected item IDs (uuids)
 */
export const computeSelection = (visible, selectionRect, mode = 'containsRect') => (
	selectionFn = mode === 'intersects' ? intersects : containsRect,
	visible
		.filter(({rect: itemRect}) => selectionFn(selectionRect, itemRect))
		.map(({uuid}) => uuid)
);

/**
 * Finds an item at a specific pixel position
 * @param {Array} visible - Array of items with {uuid/id, rect}
 * @param {Object} position - Position {x, y}
 * @returns {Object|undefined} Item with {uuid, rect} or undefined
 */
export const findEventAtPosition = (visible, position) =>
	visible.find(({rect: itemRect}) => containsVector(itemRect, position));

/**
 * Creates a normalized selection rectangle from two vectors
 * @param {Object} start - Start position {x, y}
 * @param {Object} current - Current position {x, y}
 * @returns {Object} Normalized rectangle {x, y, width, height}
 */
export const computeSelectionRect = (start, current) => fromVectors(start, current);

