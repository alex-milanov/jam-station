const {
	div, h1, header, img, i, ul, li, a, button, input, label, span
} = require('iblokz-snabbdom-helpers');

const {obj, fn} = require('iblokz-data');
const Sortable = require('sortablejs').default;

const arrPatchAt = (arr = [], index, patchFn) => [].concat(
	index > 0 ? arr.slice(0, index) : [],
	patchFn(arr[index] ?? {}),
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
