# Piano Roll E2E Test Fixes Plan

**Date:** 2025-01-27  
**Status:** Planning

## Test Results Summary

- ✅ **1 test passing**: "should display pre-existing events"
- ❌ **4 tests failing**: All selection-related tests

### Failing Tests

1. **"should partially select events by dragging selection rectangle"**
   - Expected: selection.length >= 1, selection contains 'event-1'
   - Received: selection.length = 0
   - Issue: Selection rectangle drag not creating any selections

2. **"should drag selected events"**
   - Expected: selectionBefore contains 'event-1'
   - Received: selectionBefore = []
   - Issue: Single click selection not working

3. **"should select other part and drag again"**
   - Expected: selectionAfter contains 'event-3'
   - Received: selectionAfter = []
   - Issue: Click selection not working for event-3

4. **"should select multiple events and drag them together"**
   - Expected: selection.length >= 2
   - Received: selection.length = 1
   - Issue: Selection rectangle only selecting 1 event instead of multiple

## Root Cause Analysis

### Issue 1: Selection Coordinates Mismatch
- Events were repositioned to C3-C4 range (notes 48-60)
- Test coordinates may not match actual event positions
- Canvas bounding box coordinates might be incorrect after layout changes
- **Key Issue**: Mouse coordinates are in screen space, but selection logic uses canvas space (offsetX/offsetY)
- The UI handler passes `ev.offsetX, ev.offsetY` which are canvas-relative, but Playwright mouse API uses screen coordinates

### Issue 2: Selection Logic Not Triggering
- `pointerDown` → `pointerMove` → `pointerUp` sequence might not be working correctly
- Selection rectangle computation might not be intersecting with events
- Events might not be in the "visible" array when selection happens
- **Key Issue**: During drag, selection is computed in the interaction subscription (line 464-467), but it's only set during the drag, not finalized in `pointerUp`
- The `pointerUp` function computes selection again, but might be using stale `visible` array

### Issue 3: Click Selection Not Working
- `findEventAtPosition` might not be finding events at clicked coordinates
- Event positions in "visible" array might not match actual canvas positions
- Click detection threshold might be too strict (5px)
- **Key Issue**: Coordinates passed to `pointerDown/Up` are canvas-relative (offsetX/Y), but Playwright mouse coordinates are screen-relative
- Need to convert screen coordinates to canvas coordinates before calling actions

### Issue 4: Visible Events Filter
- Events are filtered by: `noteToNumber(event.note) <= pos[1] && noteToNumber(event.note) > (pos[1] - rowCount)`
- With position[1] = 60 and rowCount = canvas.height / 12, events below (60 - rowCount) won't be visible
- C3 (note 48) might be outside visible range if rowCount is too small

## Fix Plan

### Phase 1: Fix Coordinate System Mismatch (CRITICAL)

**Tasks:**
1. **Convert screen coordinates to canvas coordinates in tests**
   - Playwright mouse API uses screen coordinates (page.mouse.move uses screen x, y)
   - UI handlers expect canvas coordinates (ev.offsetX, ev.offsetY)
   - Solution: Convert screen coordinates to canvas-relative coordinates before calling actions
   - Formula: `canvasX = screenX - canvasBox.x`, `canvasY = screenY - canvasBox.y`

2. **Update test to use canvas-relative coordinates**
   - Instead of: `page.mouse.move(canvasBox.x + 105, canvasBox.y + 150)`
   - Use: Calculate canvas-relative coordinates and dispatch events directly, OR
   - Use: `page.mouse.move()` but convert coordinates in the UI handler (not ideal)

3. **Alternative: Use `page.dispatchEvent` with correct offsetX/offsetY**
   - Get canvas element
   - Calculate offsetX = screenX - canvasBox.x
   - Calculate offsetY = screenY - canvasBox.y
   - Dispatch pointerdown/move/up events with offsetX/offsetY properties

### Phase 2: Debug and Verify Event Positions

**Tasks:**
1. Add debug logging to verify event positions in tests
   - Log actual event positions from state
   - Log canvas bounding box
   - Log click/drag coordinates (both screen and canvas-relative)
   - Log visible events array and their rects

2. Verify event positioning calculation
   - Check if events are actually visible (in visible array)
   - Verify note-to-number conversion (C3 = 48, C4 = 60)
   - Verify start position to pixel conversion: `x = (start - bar.start + 1) * dim[0]`
   - Verify note to pixel conversion: `y = (position[1] - noteNumber) * dim[1]`
   - Check if rowCount is large enough to show C3 (note 48) when position[1] = 60

3. Add visual debugging in headed mode
   - Draw event positions on canvas during tests
   - Draw selection rectangle during drag
   - Highlight clicked positions

### Phase 2: Fix Selection Rectangle Logic

**Tasks:**
1. Verify selection rectangle computation
   - Check `computeSelectionRect` is creating correct rectangle
   - Verify rectangle coordinates are in canvas space (not screen space)
   - Ensure rectangle is normalized correctly

2. Fix event intersection detection
   - Verify `computeSelection` is using correct selection mode ('containsRect' vs 'intersects')
   - Check if events in visible array have correct rect coordinates
   - Ensure selection is comparing against visible events, not all events

3. Fix selection state update
   - Verify `pointerUp` is calling `computeSelection` correctly
   - Check if selection is being set in state via `actions.set`
   - Ensure selection state is persisted after interaction ends

### Phase 3: Fix Click Selection

**Tasks:**
1. Fix `findEventAtPosition` logic
   - Verify it's checking all visible events
   - Ensure rect.containsVector is working correctly
   - Check if coordinates are in correct space (canvas vs screen)

2. Fix click detection
   - Verify click threshold (5px) is appropriate
   - Ensure click is detected as click (not drag) when movement < 5px
   - Check if `pointerUp` is handling click vs drag correctly

3. Fix event deselection
   - Verify clicking empty space deselects
   - Ensure clicking different event selects new one and deselects old

### Phase 4: Fix Multi-Selection

**Tasks:**
1. Verify selection rectangle covers multiple events
   - Check rectangle coordinates span multiple events
   - Ensure events are positioned correctly to be within rectangle

2. Fix `computeSelection` to return multiple events
   - Verify it's checking all visible events, not just first match
   - Ensure selection mode ('containsRect') includes all overlapping events
   - Check if selection array is being built correctly

### Phase 6: Update Test Coordinates

**Tasks:**
1. Recalculate all test coordinates based on actual event positions
   - C3 (note 48) at start=2: x = (2-0+1)*30 = 90, y = (60-48)*12 = 144
   - D3 (note 50) at start=3: x = (3-0+1)*30 = 120, y = (60-50)*12 = 120
   - E3 (note 52) at start=4: x = (4-0+1)*30 = 150, y = (60-52)*12 = 96
   - C4 (note 60) at start=9: x = (9-0+1)*30 = 300, y = (60-60)*12 = 0

2. Update selection rectangle coordinates
   - Ensure rectangles cover intended events
   - Account for canvas offset (canvasBox.x, canvasBox.y)

3. Update click coordinates
   - Use center of events: x + width/2, y + height/2
   - Account for canvas offset

## Implementation Order

1. **Start with Phase 1 (CRITICAL)** - Fix coordinate system mismatch
   - This is likely the root cause of all selection failures
   - Screen coordinates vs canvas coordinates mismatch
   - Must be fixed first before other phases

2. **Then Phase 2** - Add debugging to verify everything works after coordinate fix

3. **Then Phase 3** - Fix selection rectangle (if still needed after coordinate fix)

4. **Then Phase 4** - Fix click selection (if still needed)

5. **Then Phase 5** - Fix multi-selection (if still needed)

6. **Finally Phase 6** - Update all coordinates based on findings

## Success Criteria

- All 5 tests passing
- Selection rectangle correctly selects multiple events
- Click selection works for single events
- Drag selection works for partial selection
- Multi-selection and drag works correctly

## Notes

- Events are now positioned between C3 (note 48) and C4 (note 60)
- Events start at positions 2-9 (after first column)
- Piano-roll height expanded to 600px for tests
- Only piano-roll panel is visible during tests
- Web Audio and MIDI permissions are auto-granted

