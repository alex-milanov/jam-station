# Piano-Roll Improved Interaction - Summary

**Date:** 2025-12-15  
**Status:** ✅ Completed (manual testing passes, some E2E tests need updates)

## Overview

This document summarizes the complete implementation of the improved piano-roll interaction system for jam-station. Previously, the piano-roll only displayed notes from the selected track in the session. Now it supports full interaction: **selecting, moving, adding, and removing notes**.

Additionally, the service logic has been consolidated within the `src/js/services/piano-roll/` directory, making it self-contained and portable.

## Phase 1: Selection System

### Features Implemented
- **Rectangle Selection**: Drag to select multiple events with rectangle
- **Single Click Selection**: Click on event to select it
- **Deselection**: Click empty space to deselect
- **Selection Modes**: Support for both `containsRect` (event fully inside selection) and `intersects` (event partially overlaps) modes

### Implementation Details
- Extracted pure selection utility functions to `src/js/services/piano-roll/util/selection.js`
- Functions: `computeSelection`, `computeSelectionRect`, `findEventAtPosition`
- Uses `iblokz-gfx/rect` for geometric operations
- Visual feedback: Selection rectangle drawn during drag
- Selected events highlighted in green (#cfefdf fill, #214d37 border)

### Key Files
- `src/js/services/piano-roll/index.js`: Main service with pointerDown/pointerMove/pointerUp handlers
- `src/js/services/piano-roll/util/selection.js`: Pure selection utility functions

## Phase 2: Moving Events with Grid Snapping

### Features Implemented
- **Single Event Dragging**: Click and drag selected event to move it
- **Multi-Event Dragging**: Select multiple events and drag together
- **Anchor-Based Dragging**: First clicked event becomes anchor, snaps to grid
- **Relative Position Preservation**: Other events maintain exact relative positions to anchor
- **Grid Snapping**: Anchor event snaps to nearest integer grid position
- **Vertical Movement**: Fixed vertical inversion issue

### Implementation Details
- Anchor event snaps to grid (integer positions)
- Other events preserve exact relative positions (may be fractional)
- Original positions stored at drag start to prevent accumulation errors
- Movement calculated as: `anchorDelta = snappedAnchorPosition - originalAnchorPosition`
- All events updated: `newPosition = originalPosition + anchorDelta`

### Key Algorithm
```javascript
// Store original positions when drag starts
originalEventPositions = {uuid: {start, note}}

// During drag: calculate anchor's snapped movement
snappedAnchorStart = Math.round(originalAnchorStart + gridDeltaX)
anchorDeltaStart = snappedAnchorStart - originalAnchorStart

// Apply same delta to all selected events
newStart = originalStart + anchorDeltaStart
```

### Key Files
- `src/js/services/piano-roll/index.js`: pointerMove logic for multi-event dragging
- `src/js/services/piano-roll/util/grid.js`: Grid conversion utilities (pixelToGrid, gridToPixel, snapToGrid)

## Phase 3: Creating Events (Pencil Tool)

### Features Implemented
- **Click to Create**: Click empty space to create event with default duration (1 grid step)
- **Drag to Create**: Drag to create event with custom duration
- **Grid Snapping**: Created events snap to grid positions
- **Visual Preview**: Semi-transparent blue rectangle during creation
- **Auto-Selection**: Newly created events are automatically selected
- **Duplicate Prevention**: Clicking on existing event in pencil mode doesn't create duplicate

### Implementation Details
- Tool: `pencil` (also supports `pen` alias)
- Interaction type: `creating`
- Uses `pixelToGrid` to convert click position to grid coordinates
- Duration calculated from drag distance: `duration = max(1, gridX_end - gridX_start + 1)`
- Event structure: `{uuid, note, start, duration, velocity, startTime}`
- Default velocity: 0.8

### Key Files
- `src/js/services/piano-roll/index.js`: pointerDown (create initial event), pointerMove (update duration), pointerUp (finalize and add to array)

## Phase 4: Erasing Events (Eraser Tool)

### Features Implemented
- **Click to Delete**: Click on event to delete it
- **Selection Cleanup**: Automatically removes deleted event from selection
- **No-Op on Empty**: Clicking empty space does nothing
- **Immediate Deletion**: Event removed immediately on click (no confirmation)

### Implementation Details
- Tool: `eraser`
- Uses `findEventAtPosition` to locate clicked event
- Filters event out of events array: `events.filter(e => e.uuid !== deletedUuid)`
- Updates selection: `selection.filter(uuid => uuid !== deletedUuid)`
- Immutable state updates using `patch`

### Key Files
- `src/js/services/piano-roll/index.js`: pointerDown handler for eraser tool

## E2E Testing Infrastructure

### Test Framework
- **Playwright**: Headless browser automation for E2E tests
- **Headed/Headless Modes**: Conditional execution based on `HEADED` environment variable
- **Isolated Context**: Each test starts its own Parcel process on port 5678
- **Visual Debugging**: Screenshots saved to `playwright-output/` directory

### Helper Functions
- `switchTool(page, toolName)`: Switch between pointer/pencil/eraser tools
- `createEventAtPosition(page, canvas, x, y, dragToX?, dragToY?)`: Create event at position
- `deleteEventAtPosition(page, canvas, x, y)`: Delete event at position
- `execSelection(page, canvas, eventUuids)`: Select events by dragging rectangle
- `dragByAnchor(page, canvas, anchorUuid, dragX, dragY)`: Drag events by anchor
- `waitForReadability(page, headedMs, headlessMs)`: Conditional waits
- `takeScreenshot(page, name)`: Save screenshots to playwright-output/

### Test Coverage

#### Selection Tests
- Partial selection by dragging rectangle
- Single click selection
- Deselection on empty space click

#### Dragging Tests
- Single event drag (horizontal + vertical)
- Multi-event drag preserving relative positions
- Drag by different anchor events
- Grid snapping for unsnapped events
- Mixed snapped/unsnapped event dragging
- Overlapping selections with different anchors

#### Creating Tests
- Create single event with click (default duration)
- Create event with drag (custom duration)
- Create multiple events in sequence
- No duplicate when clicking existing event

#### Erasing Tests
- Delete single event
- Delete selected event (removes from selection)
- Delete from multi-selection
- No-op when clicking empty space

#### Tool Switching Tests
- Switch between pointer/pencil/eraser
- Verify correct behavior for each tool

### Test Configuration
- **File**: `test/piano-roll/piano-roll.e2e.test.js`
- **Config**: `playwright.config.js`
- **Port**: 5678 (default, configurable via TEST_PORT)
- **Parallel Execution**: Headless mode runs in parallel, headed mode runs sequentially
- **Timeout**: 60s in headed mode, 30s in headless mode

## Architecture

### Service-Based Design
- **Location**: `src/js/services/piano-roll/`
- **Structure**:
  - `index.js`: Main service with actions and RxJS subscriptions
  - `util/grid.js`: Grid conversion and drawing utilities
  - `util/selection.js`: Pure selection utility functions

### State Management
- **RxJS**: Reactive state management with BehaviorSubject
- **Immutable Updates**: All state changes use `obj.patch` for immutability
- **State Structure**:
  ```javascript
  {
    tool: 'pointer' | 'pencil' | 'eraser',
    selectionMode: 'containsRect' | 'intersects',
    interaction: {
      type: 'idle' | 'selecting' | 'moving' | 'creating' | 'deleting',
      start: {x, y},
      current: {x, y},
      anchorEventUuid: string,
      originalEventPositions: {uuid: {start, note}},
      creatingEvent: {uuid, note, start, duration, velocity}
    },
    selection: [uuid],
    visible: [{uuid, rect}],
    events: [{uuid, note, start, duration, velocity, startTime}]
  }
  ```

### Canvas Rendering
- **Three Canvas Layers**:
  1. Grid canvas: Background grid and note labels
  2. Events canvas: Event rectangles (gray/green based on selection)
  3. Interaction canvas: Selection rectangle, creation preview

### Grid System
- **Dimensions**: `[30, 12]` pixels per grid cell (width, height)
- **Conversion**: `pixelToGrid` and `gridToPixel` for coordinate conversion
- **Snapping**: `snapToGrid` for snapping to nearest grid position
- **Note System**: MIDI note numbers (C4 = 60) converted to note strings (e.g., "C4")

## Dependencies

### External Libraries
- `iblokz-gfx`: Canvas drawing, rectangle operations, grid utilities
- `iblokz-data`: Object patching for immutable updates
- `iblokz-state`: RxJS state management
- `uuid`: Event UUID generation

### Internal Utilities
- `~/util/midi`: `noteToNumber`, `numberToNote` for MIDI conversion
- `~/util/data/object`: `patch`, `patchAt` for immutable updates
- `~/util/math`: `bpmToTime`, `measureToBeatLength` for time calculations

## Known Issues & Future Work

### Known Issues
- Some E2E tests may need updates based on manual testing feedback
- Visual feedback during creation could be improved (currently semi-transparent blue)

### Future Work (Not Yet Implemented)
- **Phase 5: Resizing Events**: Drag event edges to resize duration
- **Phase 6: Polish & Refinement**:
  - Cursor changes based on tool and interaction state
  - Better visual feedback for selected events
  - Keyboard shortcuts
  - Multi-select with Shift/Ctrl modifiers
  - Undo/redo support

## Files Modified/Created

### Core Implementation
- `src/js/services/piano-roll/index.js`: Main service (pointerDown, pointerMove, pointerUp)
- `src/js/services/piano-roll/util/grid.js`: Grid utilities (pixelToGrid, gridToPixel, snapToGrid)
- `src/js/services/piano-roll/util/selection.js`: Selection utilities (computeSelection, findEventAtPosition)

### Testing
- `test/piano-roll/piano-roll.e2e.test.js`: Comprehensive E2E tests
- `playwright.config.js`: Playwright configuration

### Configuration
- `.gitignore`: Added `playwright-output/` directory
- `package.json`: Added Playwright test scripts

## Testing Commands

```bash
# Run E2E tests (headless)
pnpm test:e2e

# Run E2E tests (headed, for visual debugging)
pnpm test:e2e:headed

# Run with custom port
TEST_PORT=9999 pnpm test:e2e
```

## Summary

### Before
The piano-roll was a **read-only display** that only showed notes from the selected track in the session.

### After
The piano-roll is now a **fully interactive editor** with:
1. ✅ **Selection**: Rectangle and single-click selection with deselection
2. ✅ **Moving**: Single and multi-event dragging with grid snapping and relative position preservation
3. ✅ **Creating**: Pencil tool for creating events with click or drag
4. ✅ **Erasing**: Eraser tool for deleting events
5. ✅ **E2E Tests**: Comprehensive test coverage with visual debugging support

### Architecture Improvements
- **Self-Contained Service**: Most service logic consolidated within `src/js/services/piano-roll/` directory
- **Portable**: Service can be easily extracted or reused
- **Pure Utilities**: Selection and grid utilities are editor-agnostic
- **Immutable State**: All state updates use immutable patterns
- **Comprehensive Testing**: E2E tests with visual debugging support

All features work correctly in manual testing, with some test updates needed based on feedback.

