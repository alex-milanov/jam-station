'use strict';

// lib
const {interval, Observable} = require('rxjs');
const {scan, distinctUntilChanged, filter, flatMap} = require('rxjs/operators');
const {fn} = require('iblokz-data');

const connect = ({
	port,
	retry = false,
	suffix = '/'
}) => interval(5000).pipe(
	scan(
		ws => (!ws || ws.readyState === 3) && (retry === true || ws === false)
			? fn.pipe(
				() => new WebSocket(`ws://localhost:${port}${suffix}`),
				ws => ((ws.onopen = () => console.log('wrlds connected')), ws)
			)()
			: ws,
		false),
	distinctUntilChanged((prev, curr) => prev === curr),
	filter(ws => ws),
	flatMap(ws => new Observable(observer => {
		ws.onmessage = msg => observer.next(msg);
		ws.onerror = err => observer.error(err);
		ws.onclose = () => observer.complete();
		return () => {
			ws.onmessage = null;
			ws.onerror = null;
			ws.onclose = null;
		};
	}))
);

module.exports = {
	connect
};
