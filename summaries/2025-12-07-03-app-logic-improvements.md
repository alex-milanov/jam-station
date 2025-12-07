# App Logic Improvements - Summary

**Date:** 2025-12-07  
**Status:** Partially complete (piano roll interaction WIP, layout system ready)

## Overview

Beyond the build system migration and audio library extraction, significant app logic improvements were made focusing on:
1. **Piano Roll Interaction System** (WIP)
2. **Dynamic Layout System** (ready to commit)
3. **Utility Functions** (used, but may need cleanup)

---

## 1. Piano Roll Interaction System (WIP)

### What Was Added

**Interaction State Management:**
- Added `interaction` object to piano roll state:
  - `type`: 'idle' | 'selecting' | 'moving' | 'resizing'
  - `start`, `last`, `current`: pointer coordinates
- Added `tool`: 'pointer' | 'pen' | 'eraser'
- Added `selection`: array of UUIDs for selected events
- Added `visible`: array of visible events with hit areas

**Event System:**
- Events now have `uuid` field (using `uuid` package)
- Hit area calculations for each event
- Visible events tracking (which events are in viewport)

**UI Improvements:**
- Tool selection buttons (pointer, pencil, eraser)
- Custom cursors using FontAwesome icons (via `gfx/cursor.js`)
- Separate interaction canvas layer
- Selection highlighting (different colors for selected events)

**Actions:**
- `pointerDown({x, y})` - Start interaction
- `pointerMove({x, y})` - Update interaction (selection rectangle)
- `pointerUp({x, y})` - End interaction

**Service Updates:**
- Event rendering with selection states
- Interaction canvas rendering (selection rectangle)
- Visible events calculation and tracking

### Status
⚠️ **Work in Progress** - Interaction system is partially implemented but not complete. Selection rectangle drawing works, but full selection logic may need refinement.

---

## 2. Dynamic Layout System (Ready)

### What Was Added

**Drag-and-Drop:**
- Integrated SortableJS for widget reordering
- Widgets can be dragged between columns
- Uses `data-name` attribute for identification
- Handle-based dragging (`.header` class)

**Layout Construction:**
- Improved `constructLayout()` function
- Better column/row management
- Dynamic width calculation
- Widget positioning system

**Code Structure:**
- Refactored from `src/js/ui/layout.js` → `src/js/ui/layout/index.js`
- More modular and maintainable

**Layout Dimensions:**
- Minor adjustments to widget widths (session: 560→520, midiKeyboard: 600→560)

### Status
✅ **Ready to Commit** - Layout system is functional and ready. This is a step towards more dynamic and configurable layouts, with future plans for mobile/tablet interfaces.

---

## 3. Utility Functions

### New Files

**`src/js/util/data/function.js`:**
- `pipe()` function for function composition
- ES6 module syntax

**`src/js/util/data/object.js`:**
- `patch(obj, path, patchVal)` - Immutable object patching with function support
- `patchAt(obj, patchTree)` - Batch patching
- `sub(obj, path)` - Path-based object access
- Uses `pipe()` from function.js
- ES6 module syntax
- ⚠️ Contains `console.log` statements (should be removed)

**`src/js/util/gfx/cursor.js`:**
- `createCanvas()` - Creates canvas for icon rendering
- `iconCodeToDataURL()` - Converts FontAwesome icon codes to data URLs
- `prepIcons()` - Batch icon preparation
- `setCursor()` - Sets custom cursor on element

**`src/js/util/gfx/rect.js`:**
- Added `intersects(rect1, rect2)` - Rectangle intersection detection
- Fixed bug in `fromVectors()` (was using `x` instead of `y` for y-coordinate)
- Added `toVectors()` helper

### Usage

**Currently Used:**
- ✅ `patch` and `patchAt` are imported in `src/js/actions/piano-roll/index.js`
- ✅ `fromVectors`, `containsRect`, `intersects` used in piano roll service
- ✅ `iconCodeToDataURL` used in piano roll UI for custom cursors

**Note:**
- Data utility functions use ES6 `import/export` but rest of codebase uses CommonJS `require`
- These may be steps towards improving towards latest `iblokz-data` library state
- Consider: Should these be moved to `iblokz-data` or converted to CommonJS?

---

## Files Changed (App Logic)

### Actions
- `src/js/actions/piano-roll/index.js` - Added interaction actions, UUID support
- `src/js/actions/layout/index.js` - Minor dimension adjustments

### Services
- `src/js/services/piano-roll.js` - Major refactor: interaction handling, selection, visible events

### UI
- `src/js/ui/layout/index.js` - New drag-and-drop layout system
- `src/js/ui/piano-roll/index.js` - Tool selection, pointer events, custom cursors

### Utilities (New)
- `src/js/util/data/function.js`
- `src/js/util/data/object.js`
- `src/js/util/gfx/cursor.js`
- `src/js/util/gfx/rect.js` (updated)

---

## Commit Strategy

### Ready to Commit
1. **Layout System** - Drag-and-drop layout refactoring
2. **Utility Functions** - New utility files (but clean up console.logs first)
3. **Piano Roll Foundation** - UUID system, visible events, tool state (even if interaction WIP)

### Consider Separating
- Piano roll interaction system (WIP) could be committed separately or left unstaged until complete

---

## Next Steps

1. **Clean up utility files:**
   - Remove `console.log` statements from `data/object.js`
   - Consider converting ES6 modules to CommonJS for consistency

2. **Complete piano roll interaction:**
   - Finish selection logic
   - Implement pen tool (drawing events)
   - Implement eraser tool
   - Test interaction flow

3. **Future layout work:**
   - Mobile/tablet interface considerations
   - More dynamic layout configuration
   - Layout persistence

