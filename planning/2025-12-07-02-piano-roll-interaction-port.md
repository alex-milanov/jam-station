# Piano Roll Interaction Port from jsloops

## Overview
Port the piano-roll interaction system from jsloops (OOP architecture) to jam-station (functional/FRP architecture). The jsloops implementation has a complete interaction system with selection, moving, resizing, creating, and deleting.

## Current State (jam-station WIP)

### ✅ Already Implemented
- Basic interaction state management (`pointerDown`, `pointerMove`, `pointerUp`)
- Selection rectangle drawing (`interaction.type === 'selecting'`)
- Selection state in `pianoRoll.selection` array (UUIDs)
- Visible events computation with rects
- Hit area detection utilities (`containsRect`, `fromVectors`)
- Tool system (`pointer`, `pencil`, `eraser` - defined but not fully used)

### ❌ Missing Features
- **Moving**: Drag selected events with grid snapping
- **Resizing**: Drag from event edge to resize duration
- **Creating**: Click/drag in pencil mode to create new events
- **Deleting**: Click events in eraser mode to delete
- **Edge detection**: Detect when mouse is near event edge for resizing
- **Grid snapping**: Snap movements to grid steps
- **Multi-select**: Rectangle selection (partially done, needs completion)
- **Visual feedback**: Cursor changes, selection highlighting (partially done)

## jsloops Reference Implementation

### Interaction Modes
- `'select'` - Selection and moving
- `'edit'` - Creating, moving, resizing  
- `'delete'` - Deleting events

### Interaction States
- `'idle'` - No interaction
- `'mousedown'` - Mouse button pressed
- `'mousemove'` - Mouse moving during interaction

### Actions
- `'selecting'` - Rectangle selection (drag to select multiple)
- `'moving'` - Drag selected elements with grid snapping
- `'resizing'` - Drag from element edge to resize
- `'creating'` - Click empty space in edit mode to create
- `'deleting'` - Click element in delete mode

### Key Implementation Details
- Hit areas for collision detection
- Edge distance detection (within 1/4 step for resizing)
- Grid snapping using step-based iteration
- Selection array stores element indices
- Visual feedback on interaction layer canvas

## Architecture Differences

### jsloops (OOP)
- State managed in class instances (`this.interaction`, `this.data`)
- Direct DOM manipulation
- Event handlers attached to DOM elements
- Direct mutation of element positions

### jam-station (Functional/FRP)
- State managed in `pianoRoll` state object
- Actions return state transformers (functions)
- RxJS observables for reactive updates
- Immutable state updates via `patch`

## Implementation Plan

### Phase 1: Complete Selection System
**Goal**: Finish the rectangle selection feature

**Tasks**:
1. ✅ Selection rectangle drawing (already done)
2. ✅ Selection state management (already done)
3. ⚠️ Fix selection on mouseup (currently only updates during drag)
4. ⚠️ Single click selection (click event without drag)
5. ⚠️ Deselection (click empty space)
6. ⚠️ Visual feedback for selected events (partially done, needs refinement)

**Files to modify**:
- `src/js/actions/piano-roll/index.js` - Add/update selection actions
- `src/js/services/piano-roll.js` - Update selection rendering

**Estimated effort**: 1-2 hours

---

### Phase 2: Moving Events
**Goal**: Allow dragging selected events to new positions

**Tasks**:
1. Detect when mouse is over selected event (not edge)
2. Calculate grid-snapped position changes
3. Update event positions in state (immutably)
4. Visual feedback during drag
5. Update event `start` and `note` based on grid position

**Implementation approach**:
- Add `interaction.action: 'moving'` state
- On `pointerMove`, calculate delta and snap to grid
- Use `patch` with function updater to update event positions
- Update `visible` array to reflect new positions

**Files to modify**:
- `src/js/actions/piano-roll/index.js` - Add `move` action
- `src/js/services/piano-roll.js` - Handle moving interaction

**Dependencies**:
- Grid position utilities (convert pixel to grid position)
- Note number utilities (already have `noteToNumber`)

**Estimated effort**: 2-3 hours

---

### Phase 3: Resizing Events
**Goal**: Allow resizing event duration by dragging edge

**Tasks**:
1. Detect when mouse is near event edge (within threshold)
2. Set `interaction.action: 'resizing'` when edge detected
3. Calculate grid-snapped duration changes
4. Update event `duration` in state (immutably)
5. Visual feedback (cursor change, resize preview)

**Implementation approach**:
- Edge detection: check if mouse is within `dim[0] / 4` of event edge
- On `pointerMove` during resize, calculate new duration
- Snap duration to grid steps
- Update event `duration` property

**Files to modify**:
- `src/js/actions/piano-roll/index.js` - Add edge detection and resize logic
- `src/js/services/piano-roll.js` - Handle resizing interaction
- `src/js/util/gfx/rect.js` - Add edge detection utility (if needed)

**Dependencies**:
- Edge detection utility
- Grid snapping for duration

**Estimated effort**: 2-3 hours

---

### Phase 4: Creating Events (Pencil Tool)
**Goal**: Click/drag in pencil mode to create new events

**Tasks**:
1. Detect empty space clicks in pencil mode
2. Create new event at grid position
3. Support drag-to-create (set duration on drag)
4. Add UUID to new events
5. Add to events array in state

**Implementation approach**:
- On `pointerDown` in pencil mode, check if click is on empty space
- Create event object with `start`, `note`, `duration`, `uuid`
- On `pointerMove`, update duration if dragging
- On `pointerUp`, finalize event and add to state

**Files to modify**:
- `src/js/actions/piano-roll/index.js` - Add `create` action
- `src/js/services/piano-roll.js` - Handle creating interaction

**Dependencies**:
- Grid position to time conversion
- Note number to note name conversion

**Estimated effort**: 2-3 hours

---

### Phase 5: Deleting Events (Eraser Tool)
**Goal**: Click events in eraser mode to delete them

**Tasks**:
1. Detect event clicks in eraser mode
2. Remove event from events array
3. Update selection if deleted event was selected
4. Visual feedback (maybe highlight on hover)

**Implementation approach**:
- On `pointerDown` in eraser mode, check if click is on event
- Filter event out of events array
- Remove from selection if present

**Files to modify**:
- `src/js/actions/piano-roll/index.js` - Add `delete` action
- `src/js/services/piano-roll.js` - Handle deleting interaction

**Estimated effort**: 1 hour

---

### Phase 6: Polish & Refinement
**Goal**: Improve UX and visual feedback

**Tasks**:
1. Cursor changes based on tool and interaction state
2. Better visual feedback for selected events
3. Smooth grid snapping
4. Keyboard shortcuts (optional)
5. Multi-select with Shift/Ctrl (optional)
6. Undo/redo (future consideration)

**Files to modify**:
- `src/js/util/gfx/cursor.js` - Cursor utilities (already exists)
- `src/js/services/piano-roll.js` - Visual feedback improvements
- `src/js/actions/piano-roll/index.js` - Keyboard handlers (if added)

**Estimated effort**: 2-3 hours

---

## Technical Considerations

### Grid Snapping
- Need utilities to convert pixel coordinates to grid positions
- Snap to grid steps (currently `dim = [30, 12]`)
- Consider beat/tick quantization

### State Management
- All updates must be immutable
- Use `patch` with function updaters for complex updates
- Update `visible` array when events change

### Performance
- Only update visible events
- Debounce/throttle rapid updates if needed
- Efficient hit area detection

### Coordinate Systems
- Screen coordinates (mouse events)
- Grid coordinates (note, time)
- Canvas coordinates (pixel positions)

## Dependencies

### Existing Utilities
- ✅ `noteToNumber`, `numberToNote` (midi utils)
- ✅ `fromVectors`, `containsRect` (rect utils)
- ✅ `patch`, `patchAt` (data utils)
- ✅ `uuid` (for event IDs)

### Needed Utilities
- Grid position conversion (pixel → grid position)
- Time conversion (grid position → time)
- Edge detection (distance from event edge)
- Grid snapping (snap to nearest grid step)

## Testing Strategy

1. **Unit tests** (if test setup exists):
   - Grid position conversion
   - Edge detection
   - Selection logic

2. **Manual testing**:
   - Selection rectangle
   - Moving events
   - Resizing events
   - Creating events
   - Deleting events
   - Tool switching

## Success Criteria

- [ ] Can select multiple events with rectangle
- [ ] Can move selected events with grid snapping
- [ ] Can resize events by dragging edge
- [ ] Can create events with pencil tool
- [ ] Can delete events with eraser tool
- [ ] Visual feedback is clear and responsive
- [ ] All state updates are immutable
- [ ] Performance is acceptable

## Notes

- Keep functional/FRP architecture - no direct DOM manipulation
- All state changes through actions
- Use RxJS for reactive updates
- Maintain separation of concerns (actions, services, UI)


