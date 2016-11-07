'use strict';

const init = () => {};
const refresh = ({state, actions}) => {
	const mediaLibrary = document.querySelector('.media-library');
	const instrument = document.querySelector('.instrument');
	const sequencer = document.querySelector('.sequencer');
	const midiMap = document.querySelector('.midi-map');
	if (mediaLibrary && sequencer && midiMap) {
		instrument.style.left = mediaLibrary.offsetWidth + 40 + 'px';
		sequencer.style.left = mediaLibrary.offsetWidth + instrument.offsetWidth + 60 + 'px';
		midiMap.style.left = mediaLibrary.offsetWidth + instrument.offsetWidth + sequencer.offsetWidth + 80 + 'px';
		// console.log(midiMap.style.left, sequencer.offsetWidth);
	}
	// midiMap.style.left = sequencer.style.offsetWidth + 20 + 'px';
};

module.exports = {
	init,
	refresh
};
