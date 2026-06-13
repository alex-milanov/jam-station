// util
import viewport from './viewport';
const clock = require('./clock');
import session from './session';
import studio from './studio';
import audio from './audio';
import scheduler from './scheduler';
import transport from './transport';
import midi from './midi';
import osc from './osc';
import controls from './controls';
import assets from './assets';
import sampleBank from './sample-bank';
import pianoRoll from './piano-roll';

export const hook = ({state$, actions, tapTempo}) => {
	viewport.hook({state$, actions});
	clock.hook({state$, actions});
	session.hook({state$, actions});
	studio.hook({state$, actions});
	midi.hook({state$, actions, tapTempo});
	osc.hook({state$, actions, tapTempo});
	audio.hook({state$, actions, studio, tapTempo});
	scheduler.hook({state$, actions});
	transport.hook({state$, actions});
	sampleBank.hook({state$, actions});
	controls.hook({state$, actions});
	pianoRoll.hook({state$, actions});
};

export const unhook = () => {
	viewport.unhook();
	clock.unhook();
	session.unhook();
	studio.unhook();
	midi.unhook();
	osc.unhook();
	audio.unhook();
	scheduler.unhook();
	transport.unhook();
	sampleBank.unhook();
	controls.unhook();
	pianoRoll.unhook();
};

export default {
	hook,
	unhook
};