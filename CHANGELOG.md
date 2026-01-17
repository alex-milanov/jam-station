# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-01-17

### Fixed
- Fixed cursor interaction in piano roll by adding hotspot coordinates to tool cursors (pointer, pencil, eraser) for more accurate cursor positioning

## [1.0.0] - 2025-12-27

### Added
- Piano roll improved interaction: select, move, add, remove notes
- Piano roll selection and dragging with E2E tests
- Playwright screenshot tool
- Planning documents and todo folder structure
- Dynamic layout system (drag-and-drop widgets)

### Changed
- Migrated from Rx to RxJS
- Migrated build system to Parcel
- Refactored piano-roll to service-based architecture
- Integrated iblokz-gfx library
- Refactored audio service to use effectsChain with ID-based node management
- Reintegrated iblokz-audio library
- Switched license to AGPL-3.0
- Updated README and fixed GitHub Pages deployment

### Fixed
- Fixed issue with wavesurfer not visualizing correctly
- Fixed issues with sampler support by engine and UI
- Fixed selectionfn error
- Removed suspended screen and request permissions automatically

## [0.9.0] - 2019-05-25

### Fixed
- Various small fixes

### Changed
- Improved drum machine/sequencer and MIDI functionalities
- Additional MIDI improvements and fixes

## [0.8.0] - 2018-10-03

### Added
- Hook session track events data to MIDI output
- Additional MIDI improvements
- UI updates pertaining to MIDI changes integration
- Instrument reintroduced VCO pitch fine tune
- Added junk drum kit
- Initial OSC experiments
- Improved wrlds support
- WS util implementation for wrlds support
- Samplebank service implementation
- Initial pocket util implementation and integration
- Initial dynamic MIDI-map implementation
- Session prev/next studio implementation
- Session track row MIDI select
- Initial multibar for multitrack support
- Multi section/measure support
- Initial multi bar length sections
- Initial session implementation
- Session editors sync
- Initial piano-roll
- Grid view improvements
- Updated session handling
- Audio engine LFO reimplementation

### Changed
- Audio service refactoring
- Audio engine additional refactoring
- Layout refactoring
- MYO service update
- Keyboard controls improvements
- Drum kit interaction improvement
- OSX controller experiments
- Media library sample load fix
- Prevent loading song in playing state
- MIDI-map fixes
- Rehooked kit recording

### Fixed
- Fixed issue with VCF note jumping
- Fixed issue with recorded MIDI's ADSR events
- Fixed MIDI input
- Fixed issue with new Chrome and autoplay
- Fixed duration for recording
- Session rack placeholder UI

## [0.7.0] - 2017-10-23

### Added
- Initial reverb effect implementation
- Viewport service
- Tap tempo implementation
- MIDI-map clock syncs
- Multiple bars for song
- Keyboard and gamepad interaction
- Separate clock service
- MIDI studio control
- Better library channel integration
- Record state
- Sequencer recording
- Instrument patches

### Changed
- Audio engine refactoring
- Refactored services
- Assets & controls services cleanup
- UI updates
- MIDI improvements
- Clock sequencer fixes
- MIDI clock send test
- Load backwards compatibility
- Some refactoring

### Fixed
- Fixed HMR with vex
- Fixed reverb updates
- Improved reverb effect
- Fixed clock issues
- Pattern update fix
- Fixed issues after refactoring

## [0.6.0] - 2017-05-16

### Added
- Added back add/remove channel buttons
- Transition dependencies to published npm modules
- Patch VCF through

### Changed
- UI updates
- MIDI improvements
- Sequencer improvements

## [0.5.0] - 2017-04-29

### Added
- Added missing dependencies
- MIDI studio control

### Changed
- Clock sequencer fixes
- MIDI clock send test
- Load backwards compatibility

## [0.4.0] - 2017-04-24

### Added
- Separate clock service
- Keyboard and gamepad interaction

### Fixed
- Attempt to fix clock
- Pattern update fix

## [0.3.0] - 2017-04-02

### Added
- Better library channel integration
- Record state
- Sequencer recording
- Instrument patches

### Changed
- UI updates
- MIDI improvements

### Fixed
- Fixed HMR with vex
- Replaced icons

## [0.2.0] - 2017-03-12

### Added
- UI updates
- MIDI improvements
- Sequencer recording
- Instrument patches

## [0.1.0] - 2017-02-28

### Added
- Patch VCF through

## [0.0.9] - 2017-02-27

### Changed
- Transition dependencies to published npm modules

## [0.0.8] - 2017-02-22

### Added
- Added back add/remove channel buttons

## [0.0.7] - 2017-01-29

### Changed
- Hook back controllers

## [0.0.6] - 2017-01-25

### Changed
- UI update WIP

## [0.0.5] - 2017-01-20

### Added
- Media library sound loading implementation
- Initial library updates - UI changes, zip loading support

### Fixed
- Fixed openpathmusic.zip path
- Fixed openpathmusic.zip build

## [0.0.4] - 2017-01-18

### Added
- Initial library updates - UI changes, zip loading support

## [0.0.3] - 2017-01-15

### Added
- MIDI connection change implementation
- Improved loading

## [0.0.2] - 2017-01-14

### Added
- Initial file load, save, new functionality

## [0.0.1] - 2017-01-13

### Added
- Initial audio service
- Audio util apply pref fix
- Instrument UI updates
- Audio util updates
- Audio engine fixes
- Initial polyphony/voice support for the audio engine
- Audio engine initial pitch bend support
- Instrument UI refactoring
- Initial delay UI

### Fixed
- Audio engine polyphony fix
- Audio engine fix issues on MIDI noteOn events
- Restore base UI layout

## [Pre-0.0.1] - 2016-12-31

### Added
- Initial setup and functionality
- Initial MIDI util, MIDI-map UI, actions refactoring
- MIDI RxJS interface, initial MIDI hooks, basicsynth jam
- Display MIDI inputs and outputs, services refactoring, initial media library
- Added instrument controls ADSR
- UI color scheme update, UI media library
- Added iblokz module
- Integrate iblokz
- Instrument refactoring: VCO, LFO params
- Basic synth better MIDI note play integration
- UI updates, synth VCF support, note play fixes
- Added samples
- Studio refactoring
- UI header improvement, show/hide editors
- Added logo image
- Initial README
- Added screenshot
- Studio rework, sequencer initial channels logic, media library sample list
- Sequencer improvements: select, set, add, delete channels; UI updates
- Better state change logging, sequencer UI updates
- MIDI noteOn/Off fix, missing libs
- MIDI initials msgs implementation, initial MIDI map controllers, volume implementation, VCF fix
- Some refactoring, initial routing
- Initial MIDI keyboard
- MIDI keyboard UI update, initial audio util
- UI update, audio util fixes, basic-synth LFO algorithm rework
- UI updates, initial LFO
- Removed redundant files and dependencies, updated iblokz reference, implementation of initial hot reloading
- Instrument UI rework, added 2nd oscillator, knob support
- UI update - tuning fork
- Latency fix, VCA UI update

### Changed
- UI tweaks, colors, borders
- UI tweaks
- Redirect for gh-pages
- Updated README (multiple updates)
- Lib/iblokz sync

### Fixed
- Fix MIDI EG control values
- Fixes
