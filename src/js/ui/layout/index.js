const {
	div, h1, header, img, i, ul, li, a, button, input, label, span
} = require('iblokz-snabbdom-helpers');

const {obj, fn} = require('iblokz-data');
const Sortable = require('sortablejs').default;

// TODO: Replace with arr.patchAt from iblokz-data after it is updated
/**
 * Immutably patches an array at a given index.
 * @param {Array} arr - The source array
 * @param {number} index - The index to patch
 * @param {Object|Function} patch - The patch to apply
 * @returns {Array} A new array with the patch applied
 */
const arrPatchAt = (arr = [], index, patch) => [].concat(
	// if index is greater than 0, slice the array up to the index
	index > 0 ? arr.slice(0, index) : [],
	// if index is greater than the array length, fill the array with undefined up to the index
	arr.length - 1 < index ? new Array(index - arr.length).fill(undefined) : [],
	// if patch is a function, call it with the array at the index, otherwise apply the patch directly
	patch instanceof Function ? patch(arr[index] ?? {}) : Object.assign({}, arr[index], patch),
	// if index is less than the array length - 1, slice the array from the index + 1
	index < (arr.length - 1) ? arr.slice(index + 1) : []
);

const constructLayout = (config) => Object.keys(config)
	.map(name => ({widget: config[name], name}))
	.filter(({widget}) => widget.visible === true)
	.reduce((layout, {widget, name}) => (
		// console.log(name, widget, layout), 
		({
			cols: arrPatchAt(
				layout.cols,
				layout.cols.findIndex(col => col.id === widget.pos.col) ?? widget.pos.col,
				col => ({
					id: widget.pos.col,
					width: col.width > widget.dim.width
							? col.width
							: widget.dim.width,
					rows: arrPatchAt(col.rows ?? [], widget.pos.row,
						row => ({
							...row,
							name,
							...widget
						}))
				}))
		})), {cols: [], width: 0})

module.exports = ({state, actions}, panels) => fn.pipe(
	() => constructLayout(state.layout),
	layout => ({...layout, width: layout.cols.reduce((w, c) => w + c.width, 0)}),
	// layout => (console.log('layout', layout), layout),
	layout => div('#layout', {
		style: {
			width: `${layout.width}px`
		}
	}, layout.cols
		.sort((c1, c2) => c1.id - c2.id)
		.map(col =>
			ul({
				hook: {
					insert: vnode => (
						console.log('onInsert', vnode.elm, col.id), 
						new Sortable(vnode.elm, {
							group: 'table',
							draggable: 'li',
							handle: ".header",
							// filter: '.opened',
							// sort: false,
							// preventOnFilter: true,
							ghostClass: "placeholder",
							dataIdAttr: 'data-name',
							// onEnd: ev => drop(ev)
						})
					)
				},
				style: {
					width: `${col.width}px`
				}
			},
			col.rows
				.sort((a, b) => a.pos.row - b.pos.row)
				.map(widget =>
					li({
						key: widget.name,
						style: {
							height: widget.dim.height || 'auto'
						},
						attrs: {
							'data-name': widget.name
						}
					}, panels[widget.name]({state, actions}))
				)
			)
		)
))();
