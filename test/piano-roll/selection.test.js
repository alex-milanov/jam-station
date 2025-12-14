'use strict';

const {expect} = require('chai');
const selectionUtil = require('../../src/js/services/piano-roll/util/selection');

describe('piano-roll selection utilities', () => {
	describe('computeSelectionRect', () => {
		it('should create normalized rect from two vectors', () => {
			const result = selectionUtil.computeSelectionRect({x: 10, y: 20}, {x: 50, y: 60});
			expect(result).to.deep.equal({x: 10, y: 20, width: 40, height: 40});
		});

		it('should handle reversed vectors', () => {
			const result = selectionUtil.computeSelectionRect({x: 50, y: 60}, {x: 10, y: 20});
			expect(result).to.deep.equal({x: 10, y: 20, width: 40, height: 40});
		});

		it('should handle mixed directions', () => {
			const result = selectionUtil.computeSelectionRect({x: 10, y: 60}, {x: 50, y: 20});
			expect(result).to.deep.equal({x: 10, y: 20, width: 40, height: 40});
		});
	});

	describe('findEventAtPosition', () => {
		const visible = [
			{uuid: '1', rect: {x: 100, y: 200, width: 30, height: 12}},
			{uuid: '2', rect: {x: 150, y: 250, width: 30, height: 12}},
			{uuid: '3', rect: {x: 200, y: 300, width: 30, height: 12}}
		];

		it('should find event at position', () => {
			const result = selectionUtil.findEventAtPosition(visible, {x: 115, y: 206});
			expect(result).to.deep.equal(visible[0]);
		});

		it('should return undefined if no event at position', () => {
			const result = selectionUtil.findEventAtPosition(visible, {x: 50, y: 50});
			expect(result).to.be.undefined;
		});

		it('should handle edge cases', () => {
			const result = selectionUtil.findEventAtPosition(visible, {x: 100, y: 200});
			expect(result).to.deep.equal(visible[0]);
		});
	});

	describe('computeSelection', () => {
		const visible = [
			{uuid: '1', rect: {x: 100, y: 200, width: 30, height: 12}},
			{uuid: '2', rect: {x: 150, y: 250, width: 30, height: 12}},
			{uuid: '3', rect: {x: 200, y: 300, width: 30, height: 12}}
		];

		it('should select events within selection rectangle (containsRect mode)', () => {
			const selectionRect = {x: 90, y: 190, width: 100, height: 80};
			const result = selectionUtil.computeSelection(visible, selectionRect, 'containsRect');
			expect(result).to.deep.equal(['1', '2']);
		});

		it('should select events that intersect selection rectangle (intersects mode)', () => {
			const selectionRect = {x: 120, y: 190, width: 20, height: 80};
			const result = selectionUtil.computeSelection(visible, selectionRect, 'intersects');
			expect(result).to.deep.equal(['1', '2']);
		});

		it('should return empty array if no events selected', () => {
			const selectionRect = {x: 0, y: 0, width: 50, height: 50};
			const result = selectionUtil.computeSelection(visible, selectionRect, 'containsRect');
			expect(result).to.deep.equal([]);
		});

		it('should use containsRect as default mode', () => {
			const selectionRect = {x: 90, y: 190, width: 100, height: 80};
			const result = selectionUtil.computeSelection(visible, selectionRect);
			expect(result).to.deep.equal(['1', '2']);
		});

		it('should handle empty visible array', () => {
			const selectionRect = {x: 0, y: 0, width: 100, height: 100};
			const result = selectionUtil.computeSelection([], selectionRect, 'containsRect');
			expect(result).to.deep.equal([]);
		});

		it('should handle partial overlap differently in intersects mode', () => {
			const selectionRect = {x: 125, y: 190, width: 10, height: 80};
			// In containsRect mode, this should not select anything (rect too small)
			const containsResult = selectionUtil.computeSelection(visible, selectionRect, 'containsRect');
			expect(containsResult).to.deep.equal([]);
			
			// In intersects mode, it should select overlapping events
			const intersectsResult = selectionUtil.computeSelection(visible, selectionRect, 'intersects');
			expect(intersectsResult.length).to.be.greaterThan(0);
		});
	});
});

