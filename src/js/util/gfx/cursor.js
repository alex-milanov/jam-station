const {fn} = require('iblokz-data');

const assignKeyValue = (o, k, v) => (o[k] = v) && o;

const createCanvas = fn.pipe(
	() => Object.assign(document.createElement('canvas'), {
		width: 24,
		height: 24
	}),
	canvas => canvas.getContext('2d'),
	ctx => Object.assign(ctx, {
		fillStyle: '#ffffff',
		font: '14px FontAwesome',
		textAlign: 'center',
		textBaseline: 'middle'
	})
);

const iconCodeToDataURL = (code, ctx = createCanvas()) => {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.fillText(code, 12, 12);
	return ctx.canvas.toDataURL('image/png');
};

const prepIcons = fn.pipe(
	list => ({ctx: createCanvas(), list}),
	({ctx, list}) =>
		Object.keys(list).reduce((o, key) =>
			assignKeyValue(o, key, iconCodeToDataURL(list[key], ctx)),
		{})
);

const setCursor = (el, dataURL) => {
	el.style.cursor = `url(${dataURL}), auto`;
};

module.exports = {
	createCanvas,
	iconCodeToDataURL,
	prepIcons,
	setCursor
};
