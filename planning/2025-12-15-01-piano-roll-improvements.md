# Piano-Roll Improvements Planning

**Date:** 2025-12-15  
**Status:** Planning

## Overview

This document outlines planned improvements for the piano-roll interaction system, organized by priority and timeline.

## Short-Term Goals

### 1. Test Fixes
**Priority:** High  
**Status:** Pending

- Fix failing E2E tests based on manual testing feedback
- Ensure all test cases accurately reflect current behavior
- Update test expectations where needed

### 2. Grid Snap Granularity - 1/32 Note Length
**Priority:** High  
**Status:** Pending

**Current State:**
- Grid snapping currently supports 1/16 note length (quarter note subdivisions)

**Goal:**
- Increase granularity to support 1/32 note length
- Update grid calculation to handle finer subdivisions
- Ensure visual grid reflects new granularity
- Update snapping logic in `pixelToGrid` and `snapToGrid` functions

**Implementation Notes:**
- May need to adjust `dim` (grid dimensions) or add granularity parameter
- Consider zoom levels for visual clarity
- Update `util/grid.js` functions

### 3. Pencil Tool Behavior Updates
**Priority:** High  
**Status:** Pending

**Current Behavior:**
- Pencil click on empty space: creates event
- Pencil click on existing event: does nothing

**Desired Behavior:**
- Pencil click on note: **select it** (instead of doing nothing)
- Pencil click and drag on note: **move it** (instead of creating new event)

**Implementation Notes:**
- Update `pointerDown` in pencil tool mode
- Check if clicking on existing event first
- If event exists: start selection/moving interaction
- If empty space: create new event (current behavior)

### 4. Cursor Icon Alignment
**Priority:** Medium  
**Status:** Pending

**Current Issue:**
- Cursor icons point in different directions
- Interaction behavior doesn't match cursor direction

**Desired Behavior:**
- **Pointer tool**: Arrow up-left (↖) - matches selection from top-left
- **Pencil tool**: Arrow down-left (↙) - matches drawing from top-left to bottom-right
- **Eraser tool**: Arrow down-left (↙) - matches erasing action

**Implementation Notes:**
- Update cursor icons in `src/js/ui/piano-roll/index.js`
- Verify interaction behavior matches cursor direction
- May need to adjust selection rectangle drawing direction
- Check `iblokz-gfx/cursor` for available cursor options

## Mid-Term Goals

### 5. Advanced Grid Snap Granularity
**Priority:** Medium  
**Status:** Pending

**Goal:**
- Support 1/64 note length
- Support 1/32T (triplet) note length
- Add UI for selecting grid granularity
- Visual feedback for current grid setting

**Implementation Notes:**
- Add grid granularity selector to piano-roll UI
- Update grid calculation functions to handle multiple granularities
- Consider grid overlay visualization
- May need quantization presets (1/4, 1/8, 1/16, 1/32, 1/64, triplets)

### 6. Keyboard Shortcuts
**Priority:** Medium  
**Status:** Pending

**Shortcuts to Implement:**
- **Mode switching**: Keyboard shortcuts to change tools (pointer/pencil/eraser)
- **Select all**: `Ctrl/Cmd + A`
- **Deselect**: `Escape` or `Ctrl/Cmd + D`
- **Delete selection**: `Delete` or `Backspace`
- **Move with arrow keys**: `↑↓←→` to move selected events by grid steps
- **Fine movement**: `Shift + Arrow keys` for smaller increments

**Implementation Notes:**
- Add keyboard event handlers to piano-roll service
- Prevent default browser behavior for shortcuts
- Update state management for keyboard-driven actions
- Consider modifier key combinations (Ctrl, Shift, Alt)

### 7. Simple Quantization Interface
**Priority:** Medium  
**Status:** Pending

**Goal:**
- UI for quantizing selected events
- Options: quantize to grid, quantize start, quantize duration
- Visual feedback before applying quantization
- Undo support (see long-term)

**Implementation Notes:**
- Add quantization action to piano-roll service
- Create UI component for quantization options
- Update event positions based on quantization settings
- Consider "quantize strength" (percentage) option

### 8. Free Mode Dragging
**Priority:** Medium  
**Status:** Pending

**Goal:**
- Option to disable grid snapping during drag
- Allow precise positioning without grid constraints
- Toggle between "snap to grid" and "free mode"
- Visual indicator for current mode

**Implementation Notes:**
- Add "snap" toggle to piano-roll UI
- Update `pointerMove` to respect snap mode
- Store original positions for free mode dragging
- Consider modifier key (e.g., `Alt` key) for temporary free mode

## Long-Term Goals

### 9. Undo/Redo System
**Priority:** Low  
**Status:** Pending

**Goal:**
- Implement undo/redo for all piano-roll actions
- Store action history with state snapshots
- Keyboard shortcuts: `Ctrl/Cmd + Z` (undo), `Ctrl/Cmd + Shift + Z` (redo)
- Visual feedback for undo/redo availability

**Implementation Notes:**
- Design action history data structure
- Store state snapshots efficiently (immutable state helps)
- Consider action grouping (e.g., multi-event drag as single action)
- May need to integrate with global undo/redo system

### 10. Copy/Paste
**Priority:** Low  
**Status:** Pending

**Goal:**
- Copy selected events to clipboard
- Paste events at current cursor/selection position
- Support multiple paste operations
- Keyboard shortcuts: `Ctrl/Cmd + C`, `Ctrl/Cmd + V`

**Implementation Notes:**
- Design clipboard data format (JSON)
- Handle relative positioning for paste
- Update event UUIDs for pasted events
- Consider paste offset (paste at click position vs. original position)

### 11. Velocity Support
**Priority:** Low  
**Status:** Pending

**Goal:**
- Visual representation of velocity (color intensity or height)
- UI for editing velocity of selected events
- Velocity editing during creation (pressure sensitivity if available)
- Velocity curves/ramps

**Implementation Notes:**
- Events already have `velocity` property (0.0-1.0)
- Add visual feedback (color gradient or bar height)
- Create velocity editor UI component
- Consider MIDI velocity mapping

### 12. Automation Curves
**Priority:** Low  
**Status:** Pending

**Goal:**
- Support for automation lanes (volume, pan, effects, etc.)
- Draw automation curves
- Link automation to events
- Visual representation of automation values

**Implementation Notes:**
- Design automation data structure
- Create automation lane UI
- Curve drawing/editing tools
- Integration with audio engine
- May require significant architecture changes

## Implementation Strategy

### Phase 1: Short-Term (Immediate)
1. Fix failing tests
2. Implement 1/32 grid granularity
3. Update pencil tool behavior (select/move on existing events)
4. Fix cursor icon alignment

### Phase 2: Mid-Term (Next Sprint)
1. Advanced grid granularity (1/64, triplets)
2. Keyboard shortcuts
3. Simple quantization interface
4. Free mode dragging

### Phase 3: Long-Term (Future)
1. Undo/redo system
2. Copy/paste
3. Velocity support
4. Automation curves

## Notes

- User may have additional ideas based on:
  - Actual usage of the piano-roll
  - Features from other DAWs (Ableton Live, FL Studio, Logic Pro, etc.)
- Consider user feedback after each phase
- Some features may require architectural changes
- Prioritize based on user needs and usage patterns

## Related Files

- `src/js/services/piano-roll/index.js` - Main service
- `src/js/services/piano-roll/util/grid.js` - Grid utilities
- `src/js/services/piano-roll/util/selection.js` - Selection utilities
- `src/js/ui/piano-roll/index.js` - UI component
- `test/piano-roll/piano-roll.e2e.test.js` - E2E tests

