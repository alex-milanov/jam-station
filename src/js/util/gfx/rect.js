
const vectorAdd = (a, b) => ({
	x: a.x + b.x,
	y: a.y + b.y
});

const fromVectors = (a, b) => Object.assign(
	(a.x <= b.x)
		? {x: a.x, width: b.x - a.x}
		: {x: b.x, width: a.x - b.x},
	(a.y <= b.y)
		? {y: a.y, height: b.y - a.y}
		: {y: b.y, height: a.y - b.y}
);

const toVectors = rect => ([
	{x: rect.x, y: rect.y},
	{x: rect.x + rect.width, y: rect.y},
	{x: rect.x, y: rect.y + rect.height},
	{x: rect.x + rect.width, y: rect.y + rect.height}
])

const pan = (rect, v) => Object.assign(
	{}, rect, vectorAdd(rect, v)
);

const resize = (rect, v) => Object.assign(
	{}, rect, {
		width: rect.width + v.x - rect.x,
		height: rect.height + v.y - rect.y
	}
);

const containsVector = (rect, v) =>
	((v.x >= rect.x && v.x <= rect.x + rect.width)
		&& (v.y >= rect.y && v.y <= rect.y + rect.height));

const containsRect = (rect1, rect2) =>
	((rect1.x <= rect2.x && rect2.x + rect2.width <= rect1.x + rect1.width)
		&& (rect1.y <= rect2.y && rect2.y + rect2.height <= rect1.y + rect1.height));

const contains = (rect, obj) =>
	(obj.width)
		? containsRect(rect, obj)
		: containsVector(rect, obj);

const intersects = (rect1, rect2) => toVectors(rect2).reduce(
	(intr, vec) => intr || containsVector(rect1, vec), false
)

module.exports = {
	vectorAdd,
	fromVectors,
	pan,
	resize,
	containsVector,
	containsRect,
	contains,
	intersects
};
