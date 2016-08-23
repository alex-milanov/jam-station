'use strict';

const init = () => {};
const refresh = ({state, actions}) => {
	const mediaLibrary = document.querySelector('.media-library');
	const sequencer = document.querySelector('.sequencer');
	const midiMap = document.querySelector('.midi-map');
	if (mediaLibrary && sequencer && midiMap) {
		sequencer.style.left = mediaLibrary.offsetWidth + 40 + 'px';
		midiMap.style.left = mediaLibrary.offsetWidth + sequencer.offsetWidth + 60 + 'px';
		// console.log(midiMap.style.left, sequencer.offsetWidth);
	}
	// midiMap.style.left = sequencer.style.offsetWidth + 20 + 'px';
};

module.exports = {
	init,
	refresh
};
