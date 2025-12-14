'use strict';

const initial = {
	mediaLibrary: {
		visible: false,
		dim: {
			width: 280,
			height: '100%'
		},
		pos: {
			col: 0,
			row: 0
		}
	},
	instrument: {
		visible: true,
		dim: {
			width: 320,
			height: '100%'
		},
		pos: {
			col: 1,
			row: 0
		}
	},
	session: {
		visible: true,
		dim: {
			width: 520,
			height: '100%'
		},
		pos: {
			col: 2,
			row: 0
		}
	},
	sequencer: {
		visible: true,
		dim: {
			width: 560
		},
		pos: {
			col: 3,
			row: 0
		}
	},
	pianoRoll: {
		visible: true,
		dim: {
			width: 560,
			height: 600
		},
		pos: {
			col: 3,
			row: 1
		}
	},
	midiKeyboard: {
		visible: true,
		dim: {
			width: 560
		},
		pos: {
			col: 3,
			row: 2
		}
	},
	midiMap: {
		visible: true,
		dim: {
			width: 600,
			height: '100%'
		},
		pos: {
			col: 4,
			row: 0
		}
	}
};

module.exports = {
	initial
};
