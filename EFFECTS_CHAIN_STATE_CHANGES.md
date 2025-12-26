# Effects Chain State and Service Changes

## Summary
I've added support for effects chains in the state and services layer. The UI changes have been reverted (except the sampler component which remains), so you can implement the UI integration as you prefer.

## State Changes

### 1. Session Tracks (`src/js/actions/session/index.js`)

**Added `effectsChain` array to each track in initial state:**
- **Seq tracks** (type: 'seq'): Empty array `[]`
- **Piano tracks** (type: 'piano'): Default effects:
  ```javascript
  [
    {type: 'vcf', on: true, cutoff: 0.64, resonance: 0, gain: 0},
    {type: 'reverb', on: true, seconds: 3, decay: 2, reverse: false, dry: 0.8, wet: 0.7},
    {type: 'lfo', on: false, lfoType: 'sawtooth', frequency: 5, gain: 0.15}
  ]
  ```

**Modified `select` action:**
- Now loads `instrument` state for both `seq` and `piano` track types (previously only for piano)
- This ensures the instrument UI can access track-specific data when a seq track is selected

**State loading (`src/js/actions/index.js`):**
- Added `effectsChain` handling in `changesMap.session` to ensure it's initialized when loading saved state
- Defaults to empty array for seq tracks, or the default effects array for piano tracks

### 2. Instrument Actions (`src/js/actions/instrument/index.js`)

**Added 4 new actions for managing effects chains:**

1. **`addEffect(trackIndex, effectType, effectConfig = {})`**
   - Adds a new effect to a track's effects chain
   - `effectType`: 'vcf', 'reverb', 'lfo', or 'delay'
   - `effectConfig`: Optional override for default effect properties
   - Default configs:
     - `vcf`: `{type: 'vcf', on: true, cutoff: 0.64, resonance: 0, gain: 0}`
     - `reverb`: `{type: 'reverb', on: true, seconds: 3, decay: 2, reverse: false, dry: 0.8, wet: 0.7}`
     - `lfo`: `{type: 'lfo', on: false, lfoType: 'sawtooth', frequency: 5, gain: 0.15}`
     - `delay`: `{type: 'delay', on: false, time: 1, dry: 1, wet: 0}`
   - Updates: `state.session.tracks[trackIndex].effectsChain`

2. **`removeEffect(trackIndex, effectIndex)`**
   - Removes an effect from a track's effects chain by index
   - Updates: `state.session.tracks[trackIndex].effectsChain`

3. **`reorderEffect(trackIndex, fromIndex, toIndex)`**
   - Reorders effects in a track's effects chain (for drag-and-drop)
   - Updates: `state.session.tracks[trackIndex].effectsChain`

4. **`updateEffect(trackIndex, effectIndex, updates)`**
   - Updates properties of a specific effect in the chain
   - `updates`: Object with properties to update (e.g., `{on: false}`, `{cutoff: 0.5}`)
   - Updates: `state.session.tracks[trackIndex].effectsChain[effectIndex]`

**All actions use:**
- `obj.patch(state, ['session', 'tracks', trackIndex, 'effectsChain'], newArray)`
- This ensures immutable updates and proper state management

### 3. Session Service (`src/js/services/session.js`)

**Modified instrument subscription:**
- Now handles both `piano` and `seq` track types
- When `state.instrument` changes, it updates `state.session.tracks[trackIndex].inst` for the selected track
- This ensures instrument state is synced back to the track

## Audio Engine Changes (`src/js/services/audio.js`)

### Engine Initial State

**Added track 0 (sampler track) to `initial` engine state:**
```javascript
0: {
  voices: {}, // sampler instances keyed by note
  effectsChain: [
    a.vcf({cutoff: 0.64}),
    a.create('reverb', {wet: 0.1, dry: 0.9})
  ],
  volume: a.vca({gain: 0.3}),
  context: a.context
}
```

**Modified tracks 1-3:**
- Renamed `effects` to `effectsChain` (array of audio nodes)
- Kept individual effect nodes (`vcf`, `reverb`, `lfo`) for backward compatibility (these should be removed later when `updateConnections` is refactored)

**Current structure:**
```javascript
1: {
  voices: {},
  effectsChain: [
    a.vcf({cutoff: 0.64}),
    a.create('reverb', {wet: 0.1, dry: 0.9}),
    a.start(a.lfo({}))
  ],
  vcf: a.vcf({cutoff: 0.64}), // TODO: Remove after refactoring
  reverb: a.create('reverb'), // TODO: Remove after refactoring
  lfo: a.start(a.lfo({})), // TODO: Remove after refactoring
  volume: a.vca({gain: 0.3}),
  context: a.context
}
```

### TODO: Audio Engine Refactoring

**`updateConnections` function needs to be refactored to:**
1. Use `effectsChain` array instead of direct key access (`track.vcf`, `track.reverb`, etc.)
2. Connect effects in order based on array index
3. Handle effect on/off state from `state.session.tracks[trackIndex].effectsChain[effectIndex].on`
4. Update effect parameters from state (cutoff, resonance, wet, dry, etc.)

**Current approach (needs refactoring):**
- Effects are accessed directly: `track.vcf`, `track.reverb`, `track.lfo`
- Connections are hardcoded

**Proposed approach:**
- Iterate through `track.effectsChain` array
- Connect effects in sequence: `source -> effectsChain[0] -> effectsChain[1] -> ... -> volume -> destination`
- Only connect effects where `effect.on === true`
- Update effect parameters from `state.session.tracks[trackIndex].effectsChain[effectIndex]`

## UI Integration Recommendations

### 1. Effects Chain Component

**Location:** `src/js/ui/instrument/effects-chain/index.js` (you'll need to create this)

**Structure:**
- Should be a `form` containing `fieldset` elements (one per effect)
- Use SortableJS for drag-and-drop reordering (handle: `legend` element)
- Each `fieldset` should:
  - Have a `legend` with: expand/collapse icon, effect name, 3-dots menu button, on/off toggle
  - Use existing effect components (`vcf`, `reverb`, `lfo`, `delay`) - wrap them to adapt state/actions
  - 3-dots menu should allow: change effect type, remove effect

**State access:**
- Get selected track: `state.session.selection.piano` or `state.session.selection.seq`
- Get effects chain: `state.session.tracks[trackIndex].effectsChain`
- Update via: `actions.instrument.addEffect`, `removeEffect`, `reorderEffect`, `updateEffect`

### 2. Instrument UI Integration

**Location:** `src/js/ui/instrument/index.js`

**Current state:** Reverted to original (shows VCOs, VCAs, VCF, LFO, Reverb directly)

**Options:**
1. **Replace individual effects with effects chain component** - Remove `vcf`, `lfo`, `reverb` fieldsets, add `effectsChain` component
2. **Add effects chain below existing effects** - Keep current UI, add effects chain as additional section
3. **Conditional rendering** - Show effects chain for selected track, individual effects for instrument state

**Recommendation:** Option 1 - Replace individual effects with effects chain, as effects are now per-track rather than global instrument state.

### 3. Sampler Component

**Location:** `src/js/ui/instrument/sampler/index.js` (already created, kept)

**Current implementation:**
- Shows sample name from `state.sequencer.channel`
- Uses Wavesurfer.js for visualization
- Has play/pause button
- Sample file: `state.mediaLibrary.files[state.sequencer.channels[state.sequencer.channel]]`

**Integration:**
- Should be shown when a `seq` track is selected
- Should replace VCO fieldsets for sampler tracks

## Data Flow

```
User selects track
  ↓
session.select() loads instrument state from track.inst
  ↓
Instrument UI renders based on selected track type
  ↓
User modifies effects chain via UI
  ↓
actions.instrument.addEffect/removeEffect/reorderEffect/updateEffect
  ↓
State updated: state.session.tracks[trackIndex].effectsChain
  ↓
Session service syncs to track.inst (if needed)
  ↓
Audio service should update engine connections (TODO)
```

## Next Steps

1. **Create effects chain UI component** - Form with sortable fieldsets
2. **Integrate into instrument UI** - Replace or supplement existing effects
3. **Refactor audio service** - Update `updateConnections` to use effectsChain array
4. **Remove deprecated effect nodes** - Clean up `vcf`, `reverb`, `lfo` direct properties from engine state
5. **Add volume visualization** - Show volume meters in session UI (optional)



