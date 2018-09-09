'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;
const {fn} = require('iblokz-data');

const connect = ({
	port,
	retry = false,
	suffix = '/'
}) => (
		$.interval(5000)
	)
	.scan(
		ws => (!ws || ws.readyState === 3) && (retry === true || ws === false)
			? fn.pipe(
				() => new WebSocket(`ws://localhost:${port}${suffix}`),
				ws => ((ws.onopen = () => console.log('wrlds connected')), ws)
			)()
			: ws,
		false)
	.distinctUntilChanged(ws => ws)
	.filter(ws => ws)
	.flatMap(ws => $.create(obs => (
		(ws.onmessage = msg => obs.onNext(msg)),
		true
	)));

module.exports = {
	connect
};
