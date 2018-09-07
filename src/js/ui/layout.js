'use strict';

const {div, h1, header, img, i, ul, li, a, button, input, label, span} = require('iblokz-snabbdom-helpers');

const {obj, fn} = require('iblokz-data');

const arrPatchAt = (arr, index, patch) => [].concat(
	index > -1 ? arr.slice(0, index) : arr,
	{...(arr[index] || {}), ...patch},
	index > -1 ? arr.slice(index + 1) : []
);

module.exports = ({state, actions}, panels) => fn.pipe(
	() => Object.keys(panels)
		// .sort((p1, p2) => state.layout[p1].pos.col - state.layout[p2].pos.col)
		.filter(panel => state.layout[panel].visible)
		// distribute panels accross
		.reduce((layout, panel) => fn.pipe(
			() => layout.cols.findIndex(col => col.id === state.layout[panel].pos.col),
			index => ({index, col: layout.cols[index] || {width: 0, rows: [], id: state.layout[panel].pos.col}}),
			// data => (console.log(layout.cols, data), data),
			({index, col}) => ({
				cols: arrPatchAt(
					layout.cols,
					index,
					{
						id: state.layout[panel].pos.col,
						width: col.width > state.layout[panel].dim.width
								? col.width
								: state.layout[panel].dim.width,
						rows: [].concat(
							col.rows,
							{
								name: panel,
								...state.layout[panel],
								content: panels[panel]({state, actions})
							}
						)
					}
				)
			})
		)(),
		{cols: []}
	),
	layout => ({...layout, width: layout.cols.reduce((w, c) => w + c.width, 0)}),
	layout => div('#layout', {
		style: {
			width: `${layout.width}px`
		}
	}, layout.cols
		.sort((c1, c2) => c1.id - c2.id)
		.map(col =>
			ul({
				style: {
					width: `${col.width}px`
				}
			},
			col.rows
				.sort((a, b) => a.pos.row - b.pos.row)
				.map(panel =>
					li({
						style: {
							height: panel.dim.height || 'auto'
						}
					}, panel.content)
				)
			)
		)
))();
