'use strict';

const clear = ctx =>
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

const line = (ctx, start, finish, stroke, dash) => {
	ctx.beginPath();
	ctx.moveTo(start.x, start.y);
	ctx.lineTo(finish.x, finish.y);
	if (dash) {
		ctx.setLineDash(dash);
	}
	ctx.lineWidth = 1;
	ctx.strokeStyle = stroke;
	ctx.stroke();
};

const rect = (ctx, rect = {x: 0, y: 0, width: 0, height: 0}, background, stroke, dash) => {
	ctx.beginPath();
	ctx.rect(rect.x, rect.y, rect.width, rect.height);
	if (background) {
		ctx.fillStyle = background;
		ctx.fill();
	}
	if (dash) {
		ctx.setLineDash(dash);
	}
	if (stroke) {
		ctx.lineWidth = 1;
		ctx.strokeStyle = stroke;
		ctx.stroke();
	}
};

const refresh = ctx => Object.assign(ctx.canvas, {
	width: ctx.canvas.parentNode.offsetWidth,
	height: ctx.canvas.parentNode.offsetHeight
});

module.exports = {
	clear,
	line,
	rect,
	refresh
};
