import {auditTime, withLatestFrom, filter, distinctUntilChanged} from 'rxjs/operators';

import * as time from '~/util/time';
import {derivePosition} from '~/util/position';

let subs = [];

export const hook = ({state$, actions}) => {
	subs = [];

	// sync playhead while playing (~30fps; tighter during recording)
	subs.push(
		time.frame().pipe(
			withLatestFrom(state$, (t, state) => state),
			filter(state => state.studio.playing && state.studio.startTime != null),
			auditTime(32)
		).subscribe(state => {
			const tick = derivePosition(state.studio, state.sequencer, state.session);
			actions.studio.syncTick(tick);
		})
	);

	// freeze playhead on pause
	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) => prev.studio.playing === curr.studio.playing),
			filter(state => !state.studio.playing && state.studio.cycleOffset > 0)
		).subscribe(state => {
			const tick = derivePosition(
				Object.assign({}, state.studio, {playing: true}),
				state.sequencer,
				state.session,
				state.studio.startTime
			);
			actions.studio.syncTick(tick);
		})
	);
};

export let unhook = () => subs.forEach(sub => sub.unsubscribe());

export default {
	hook,
	unhook
};