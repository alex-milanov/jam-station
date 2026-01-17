# Audio Service Improvements

## Overview
This plan unifies track management in the audio engine, introduces index-based effects chains, and enhances the instrument UI to support both synth and sampler tracks with wavesurfer visualization.

## Architecture Changes

### 1. Unify Track Management in Engine

**Current State:**
- Track 0 (sampler/sequencer) is handled separately in `audio.js` hook (lines 458-503)
- Tracks 1-3 (synth) are managed in engine structure with `initial` state (lines 68-144)
- Sampler instances are created on-the-fly and connected directly to global reverb

**Target State:**
- All tracks (0-3) should be managed within the engine structure
- Track 0 should have engine entry with sampler-specific structure
- Sampler should be managed like synth tracks with proper voice/effects/volume structure

**Files to Modify:**
- `src/js/services/audio.js`: 
  - Add track 0 to `initial` engine state with sampler structure
  - Move sampler voice management into engine (similar to synth voices)
  - Update sequencer playback to use engine[0] structure

### 2. Effects Chain Structure

**State Structure:**
- **Session State**: `session.tracks[trackIndex].effectsChain` - Array of effect configs
  ```javascript
  effectsChain: [
    {type: 'vcf', on: true, cutoff: 0.64, resonance: 0, ...},
    {type: 'reverb', on: true, wet: 0.1, dry: 0.9, ...},
    {type: 'lfo', on: false, ...}
  ]
  ```
- **Engine State**: `engine[trackIndex].effectsChain` - Array of audio nodes
  ```javascript
  effectsChain: [
    vcfNode,
    reverbNode,
    lfoNode
  ]
  ```

**Connection Logic:**
- Route audio through effects chain by index: `source -> effectsChain[0] -> effectsChain[1] -> ... -> volume -> globalVolume`
- Effects with `on: false` should be bypassed (disconnected) but remain in chain
- Reordering effects (via SortableJS) updates both state arrays and reconnects audio nodes
- Effects chain is per-track, not per-sample

**Files to Modify:**
- `src/js/services/audio.js`: 
  - Add `effectsChain` to `initial` engine state for all tracks
  - Update `updateConnections` to use effects chain array instead of direct key access
  - Create helper function to rebuild connections based on effects chain order
- `src/js/actions/session/index.js`: 
  - Add `effectsChain` to track initial state
- `src/js/actions/instrument/index.js`: 
  - Add effects chain actions (add, remove, reorder, update)

### 3. Instrument UI Enhancements

**Conditional Rendering Based on Track Type:**
- **Synth Track (type: 'piano')**: Show VCO1, VCO2, VCA1, VCA2 (remove vca3, vca4)
- **Sampler Track (type: 'seq')**: Show wavesurfer visualization, VCA1 only

**Wavesurfer Integration:**
- Create `src/js/ui/instrument/sampler/index.js` component
- Use wavesurfer.js (similar to xAmplR implementation)
- Display waveform for the sample selected in sequencer UI
- Sample selection is determined by `state.sequencer.channel` (channel index)
- Sample file is retrieved from `state.mediaLibrary.files[state.sequencer.channels[state.sequencer.channel]]`
- Component should display:
  - Sample name (from mediaLibrary.files)
  - Wavesurfer waveform visualization
  - Playback controls (play/pause button only - no crop tools for now)
- Effects chain is for the whole track, not per-sample

**Effects Chain UI:**
- Create `src/js/ui/instrument/effects-chain/index.js` component
- Use SortableJS for drag-and-drop reordering
- Each effect item shows:
  - Vertical 3-dots menu (change effect type, remove)
  - Effect name/type
  - On/off toggle
  - Effect-specific controls (expanded when on)
- Plus button at bottom to add new effects
- Effects available: VCF, Reverb, LFO, Delay (if implemented)

**Volume Visualization:**
- Add volume meter/visualization to each track in session UI
- Show real-time volume levels (can use Web Audio API AnalyserNode)

**Files to Modify:**
- `src/js/ui/instrument/index.js`: 
  - Conditionally render VCOs vs wavesurfer based on `state.session.tracks[selectedTrack].type`
  - Show only VCA1, VCA2 for synth (remove vca3, vca4)
  - Show only VCA1 for sampler
  - Add effects chain component (for whole track)
  - Pass sequencer state to sampler component to determine which sample to display
- `src/js/ui/instrument/sampler/index.js`: New file - wavesurfer component
  - Display sample name from `state.mediaLibrary.files[state.sequencer.channels[state.sequencer.channel]]`
  - Show wavesurfer visualization for selected sample
  - Playback controls (play/pause only)
  - React to `state.sequencer.channel` changes to update displayed sample
- `src/js/ui/session/index.js`: Add volume visualization per track
- `src/js/actions/instrument/index.js`: 
  - Remove vca3, vca4 from initial state
  - Add effects chain actions

### 4. Session Selection Updates

**Current Behavior:**
- Selecting synth track loads: `pianoRoll`, `instrument`
- Selecting seq track loads: `sequencer` only

**Target Behavior:**
- Selecting seq track should also load `instrument` state (for sampler UI)
- Instrument UI should detect track type and render accordingly

**Files to Modify:**
- `src/js/actions/session/index.js`: 
  - Update `select` function to also load instrument for seq tracks
- `src/js/services/session.js`: 
  - Update instrument subscription to handle both piano and seq track types

### 5. Audio Service Refactoring

**Remove Unused VCAs:**
- Remove vca3, vca4 from instrument initial state
- Update UI to only show vca1, vca2 for synth

**Sampler Engine Integration:**
- Track 0 engine structure:
  ```javascript
  0: {
    voices: {}, // sampler instances keyed by note
    effectsChain: [vcfNode, reverbNode, ...],
    volume: a.vca({gain: 0.3}),
    context: a.context
  }
  ```
- Update sequencer playback to use `engine[0]` structure
- Update sampler note-on/off to manage voices in engine[0].voices

**Files to Modify:**
- `src/js/services/audio.js`: 
  - Add track 0 to initial engine state
  - Refactor sampler handling (lines 458-503) to use engine structure
  - Update sequencer playback (lines 539-580) to route through engine[0]
  - Update connections to use effects chain array

## Implementation Order

1. **Phase 1: Effects Chain State Structure**
   - Add effectsChain to session.tracks initial state
   - Add effectsChain to engine initial state
   - Create effects chain actions (add, remove, reorder, update)

2. **Phase 2: Audio Service Refactoring**
   - Add track 0 to engine initial state
   - Move sampler management into engine structure
   - Update connections to use effects chain array

3. **Phase 3: Instrument UI Updates**
   - Remove vca3, vca4 from UI and state
   - Add conditional rendering for synth vs sampler
   - Create sampler/wavesurfer component
   - Create effects chain UI component

4. **Phase 4: Session Selection & Volume**
   - Update session selection to load instrument for seq tracks
   - Add volume visualization to session UI

## Dependencies

- `wavesurfer.js` - Need to check if already in package.json, if not add it
- `sortablejs` - Already available (confirmed in package.json)
- `iblokz-audio` - For audio node creation and management

## Notes

- Changing source type (synth ↔ sampler) is out of scope for now
- Keep existing sequencer and piano-roll logic unchanged
- Only visual/instrument UI changes for now
- Effects chain routing should maintain backward compatibility during transition
- Effects chain is per-track, not per-sample
- Sample selection in instrument UI is driven by sequencer UI selection (`state.sequencer.channel`)
- Wavesurfer component should only include playback controls for now (no crop/editing tools)




