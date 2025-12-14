# Piano Roll UI Testing Strategy

## Overview
Add UI tests for piano-roll interactions that can simulate mouse events and verify state changes. The tests should work with the functional/FRP architecture. We need to test:
- Canvas layer interactions (grid, events, interaction)
- Selection logic
- Moving events
- Resizing events
- Creating events
- Deleting events
- Hit area detection
- Visual feedback

## Key Challenge
The interaction logic is currently mixed with state management. To make it testable, we should extract pure functions that can be tested independently without going through state changes.

## Testing Approach Options

### Option 1: Extract Pure Functions + Unit Tests (Recommended)
Extract interaction logic into pure, testable functions. Test these functions directly, then test actions that use them.

**Pros:**
- Fast execution
- No DOM setup needed
- Tests pure functions
- Easy to debug
- Reproducible
- Can test logic without state management

**Cons:**
- Requires refactoring to extract functions
- Doesn't test actual DOM events
- Doesn't test canvas rendering

**Implementation:**
1. Extract interaction logic into pure functions:
   - `computeSelection(visible, selectionRect)` - which events are selected
   - `computeMoveDelta(startPos, currentPos, dim)` - calculate grid-snapped movement
   - `detectEdge(rect, position, threshold)` - detect if mouse is near edge
   - `computeResize(rect, delta, dim)` - calculate new duration
   - `pixelToGrid(x, y, dim, position, bar)` - convert pixel to grid position
   - `gridToPixel(gridPos, dim, position, bar)` - convert grid to pixel position
2. Test these functions with various inputs
3. Test actions that use these functions

**Example:**
```javascript
// Extract pure function
const computeSelection = (visible, selectionRect) => 
  visible.filter(({rect}) => containsRect(selectionRect, rect))
    .map(({uuid}) => uuid);

// Test the function directly
expect(computeSelection(visible, rect)).to.deep.equal(['uuid1', 'uuid2']);

// Test action that uses it
const result = pointerMove({x, y})(state);
expect(result.pianoRoll.selection).to.deep.equal(['uuid1', 'uuid2']);
```

### Option 2: Canvas Integration Tests with JSDOM
Use JSDOM to simulate DOM and canvas, test full interaction flow including rendering.

**Pros:**
- Tests closer to real behavior
- Can test canvas rendering
- Can test event handlers
- Can test hit area detection on actual canvas

**Cons:**
- More setup required
- Slower execution
- More complex
- Canvas API simulation can be tricky

**Implementation:**
- Setup JSDOM with canvas polyfill
- Create test canvas elements
- Simulate mouse events
- Test rendering and hit detection

### Option 3: Hybrid Approach
Extract pure functions + unit tests + selective integration tests.

**Pros:**
- Best of both worlds
- Fast unit tests for logic
- Integration tests for critical paths
- Can test canvas rendering where needed

**Cons:**
- More test files to maintain
- More setup complexity

### Option 4: Skip Testing (Not Recommended)
Don't add tests, rely on manual testing.

**Pros:**
- No setup time
- No maintenance

**Cons:**
- No automated verification
- Regression risk
- Harder to refactor confidently

## Recommended: Option 1 (Extract Pure Functions)

### Functions to Extract

#### Selection Logic
```javascript
// src/js/util/piano-roll/selection.js
export const computeSelection = (visible, selectionRect) => 
  visible.filter(({rect}) => containsRect(selectionRect, rect))
    .map(({uuid}) => uuid);

export const findEventAtPosition = (visible, position) =>
  visible.find(({rect}) => containsVector(rect, position));
```

#### Grid Conversion
```javascript
// src/js/util/piano-roll/grid.js
export const pixelToGrid = (x, y, dim, position, bar, beatLength) => {
  // Convert pixel coordinates to grid position (note, time)
  const gridX = Math.floor((x - dim[0]) / dim[0]);
  const gridY = Math.floor(y / dim[1]);
  const note = numberToNote(position[1] - gridY);
  const time = bar * beatLength + gridX;
  return {note, time, gridX, gridY};
};

export const gridToPixel = (note, time, dim, position, bar, beatLength) => {
  // Convert grid position to pixel coordinates
  const gridX = time - (bar * beatLength);
  const gridY = position[1] - noteToNumber(note);
  return {
    x: dim[0] + gridX * dim[0],
    y: gridY * dim[1]
  };
};
```

#### Movement Logic
```javascript
// src/js/util/piano-roll/movement.js
export const computeMoveDelta = (startPos, currentPos, dim) => {
  const deltaX = currentPos.x - startPos.x;
  const deltaY = currentPos.y - startPos.y;
  const gridDeltaX = Math.round(deltaX / dim[0]);
  const gridDeltaY = Math.round(deltaY / dim[1]);
  return {gridDeltaX, gridDeltaY, pixelDeltaX: deltaX, pixelDeltaY: deltaY};
};

export const applyMove = (events, selection, deltaX, deltaY, dim, position, bar, beatLength) => {
  // Return new events with updated positions
  return events.map(event => {
    if (selection.indexOf(event.uuid) === -1) return event;
    const newTime = event.start + deltaX;
    const newNote = numberToNote(noteToNumber(event.note) + deltaY);
    return {...event, start: newTime, note: newNote};
  });
};
```

#### Edge Detection
```javascript
// src/js/util/piano-roll/edge.js
export const detectEdge = (rect, position, threshold) => {
  const distanceFromRight = (rect.x + rect.width) - position.x;
  return distanceFromRight < threshold;
};

export const computeResize = (event, deltaX, dim) => {
  const gridDelta = Math.round(deltaX / dim[0]);
  const newDuration = Math.max(1, event.duration + gridDelta);
  return {...event, duration: newDuration};
};
```

#### Hit Area Computation
```javascript
// src/js/util/piano-roll/hit-areas.js
export const computeHitAreas = (events, dim, position, bar, beatLength) => {
  return events.map(event => ({
    ...event,
    rect: {
      x: (event.start - (bar * beatLength) + 1) * dim[0],
      y: (position[1] - noteToNumber(event.note)) * dim[1],
      width: event.duration * dim[0],
      height: dim[1]
    }
  }));
};
```

### Test Structure
```
test/
  piano-roll/
    selection.test.js      # Test selection computation
    grid.test.js           # Test grid conversions
    movement.test.js       # Test movement logic
    edge.test.js           # Test edge detection
    hit-areas.test.js      # Test hit area computation
    actions.test.js        # Test actions (using extracted functions)
    integration.test.js    # Optional: integration tests
```

### Example Tests

```javascript
// test/piano-roll/selection.test.js
import {expect} from 'chai';
import {computeSelection, findEventAtPosition} from '../../src/js/util/piano-roll/selection';

describe('selection', () => {
  const visible = [
    {uuid: '1', rect: {x: 100, y: 200, width: 30, height: 12}},
    {uuid: '2', rect: {x: 150, y: 250, width: 30, height: 12}},
    {uuid: '3', rect: {x: 200, y: 300, width: 30, height: 12}}
  ];
  
  describe('computeSelection', () => {
    it('should select events within selection rectangle', () => {
      const selectionRect = {x: 90, y: 190, width: 100, height: 80};
      const result = computeSelection(visible, selectionRect);
      expect(result).to.deep.equal(['1', '2']);
    });
    
    it('should return empty array if no events selected', () => {
      const selectionRect = {x: 0, y: 0, width: 50, height: 50};
      const result = computeSelection(visible, selectionRect);
      expect(result).to.deep.equal([]);
    });
  });
  
  describe('findEventAtPosition', () => {
    it('should find event at position', () => {
      const result = findEventAtPosition(visible, {x: 115, y: 206});
      expect(result).to.deep.equal(visible[0]);
    });
    
    it('should return undefined if no event at position', () => {
      const result = findEventAtPosition(visible, {x: 50, y: 50});
      expect(result).to.be.undefined;
    });
  });
});

// test/piano-roll/grid.test.js
import {expect} from 'chai';
import {pixelToGrid, gridToPixel} from '../../src/js/util/piano-roll/grid';

describe('grid conversion', () => {
  const dim = [30, 12];
  const position = [0, 60];
  const bar = 0;
  const beatLength = 16;
  
  describe('pixelToGrid', () => {
    it('should convert pixel to grid position', () => {
      const result = pixelToGrid(60, 24, dim, position, bar, beatLength);
      expect(result.gridX).to.equal(1);
      expect(result.gridY).to.equal(2);
      expect(result.note).to.equal('A4'); // 60 - 2 = 58
    });
  });
  
  describe('gridToPixel', () => {
    it('should convert grid position to pixel', () => {
      const result = gridToPixel('C4', 2, dim, position, bar, beatLength);
      expect(result.x).to.equal(90); // 30 + 2 * 30
      expect(result.y).to.equal(24); // 2 * 12
    });
  });
});
```

## Implementation Options

### Option A: Extract Functions During Development
Extract functions as we implement each phase.

**Pros:**
- Functions extracted naturally as needed
- Can test as we go
- No upfront refactoring

**Cons:**
- Might need to refactor existing code
- Testing comes after implementation

### Option B: Extract Functions First, Then Implement
Refactor to extract functions before implementing features.

**Pros:**
- Clean separation from start
- Can test functions before using them
- Better architecture

**Cons:**
- More upfront work
- Might extract functions we don't need

### Option C: Extract Functions + Add Tests in Same Phase
For each phase, extract needed functions and add tests.

**Pros:**
- Balanced approach
- Test as we build
- Incremental improvement

**Cons:**
- Need to plan function extraction per phase

### Option D: Skip Testing Initially, Add Later
Implement features first, add tests later.

**Pros:**
- Faster initial development
- Can add tests when needed

**Cons:**
- Harder to add tests to existing code
- Might miss edge cases
- Less confidence in refactoring

## Recommendation

**For Piano-Roll Integration:**
- **Option C**: Extract functions + add tests per phase
- Start with Phase 1 (Selection) - extract selection functions and test them
- Continue for each phase as we implement

**Why:**
- Balanced approach
- Tests help verify implementation
- Functions are naturally extracted as needed
- Can skip testing for less critical features if needed

## Testing Scope Options

### Full Testing
- Extract all interaction functions
- Test all functions
- Test all actions
- Integration tests for critical paths

**Effort:** High (adds ~30-40% to development time)

### Partial Testing
- Extract and test critical functions (selection, movement, grid conversion)
- Skip tests for simple functions
- Test actions for complex interactions only

**Effort:** Medium (adds ~15-20% to development time)

### Minimal Testing
- Extract functions but only test edge cases
- Test only complex logic (selection, movement)
- Skip simple functions

**Effort:** Low (adds ~5-10% to development time)

### No Testing
- Extract functions for code organization only
- No tests
- Manual testing only

**Effort:** None (but higher risk)

## Recommended: Option 1 (Lightweight Unit Tests)

### Test Framework
- **Mocha** - Test runner (same as iblokz-audio)
- **Chai** - Assertions
- **No DOM needed** - Test pure functions

### Test Structure
```
test/
  piano-roll/
    actions.test.js      # Test actions as pure functions
    interaction.test.js  # Test interaction state changes
    selection.test.js    # Test selection logic
    utils.test.js        # Test utility functions
```

### Example Test Pattern

```javascript
// test/piano-roll/actions.test.js
import {expect} from 'chai';
import {pointerDown, pointerMove, pointerUp} from '../../src/js/actions/piano-roll';

describe('piano-roll actions', () => {
  describe('pointerDown', () => {
    it('should set interaction state to selecting in pointer mode', () => {
      const state = {
        pianoRoll: {
          tool: 'pointer',
          interaction: {type: 'idle', start: null, current: null, last: null}
        }
      };
      
      const result = pointerDown({x: 100, y: 200})(state);
      
      expect(result.pianoRoll.interaction.type).to.equal('selecting');
      expect(result.pianoRoll.interaction.start).to.deep.equal({x: 100, y: 200});
    });
    
    it('should set interaction state to idle in pencil mode', () => {
      const state = {
        pianoRoll: {
          tool: 'pencil',
          interaction: {type: 'idle', start: null, current: null, last: null}
        }
      };
      
      const result = pointerDown({x: 100, y: 200})(state);
      
      expect(result.pianoRoll.interaction.type).to.equal('idle');
    });
  });
  
  describe('pointerMove', () => {
    it('should update current position during selection', () => {
      const state = {
        pianoRoll: {
          interaction: {
            type: 'selecting',
            start: {x: 100, y: 200},
            current: {x: 100, y: 200},
            last: {x: 100, y: 200}
          }
        }
      };
      
      const result = pointerMove({x: 150, y: 250})(state);
      
      expect(result.pianoRoll.interaction.current).to.deep.equal({x: 150, y: 250});
      expect(result.pianoRoll.interaction.last).to.deep.equal({x: 100, y: 200});
    });
    
    it('should not update if interaction type is idle', () => {
      const state = {
        pianoRoll: {
          interaction: {type: 'idle', start: null, current: null, last: null}
        }
      };
      
      const result = pointerMove({x: 150, y: 250})(state);
      
      expect(result).to.equal(state); // Should return same state
    });
  });
  
  describe('selection', () => {
    it('should select events within selection rectangle', () => {
      const state = {
        pianoRoll: {
          visible: [
            {uuid: '1', rect: {x: 120, y: 220, width: 30, height: 12}},
            {uuid: '2', rect: {x: 160, y: 240, width: 30, height: 12}},
            {uuid: '3', rect: {x: 200, y: 260, width: 30, height: 12}}
          ],
          interaction: {
            type: 'selecting',
            start: {x: 100, y: 200},
            current: {x: 180, y: 250}
          }
        }
      };
      
      // This would be tested in the service layer where selection is computed
      // Or we could test the selection computation logic directly
    });
  });
});
```

### Testing Interaction Scenarios

```javascript
describe('interaction scenarios', () => {
  it('should complete a selection drag', () => {
    let state = {
      pianoRoll: {
        tool: 'pointer',
        interaction: {type: 'idle', start: null, current: null, last: null},
        visible: [
          {uuid: '1', rect: {x: 120, y: 220, width: 30, height: 12}}
        ],
        selection: []
      }
    };
    
    // Simulate pointerDown
    state = pointerDown({x: 100, y: 200})(state);
    expect(state.pianoRoll.interaction.type).to.equal('selecting');
    
    // Simulate pointerMove
    state = pointerMove({x: 150, y: 250})(state);
    expect(state.pianoRoll.interaction.current).to.deep.equal({x: 150, y: 250});
    
    // Simulate pointerUp
    state = pointerUp({x: 150, y: 250})(state);
    expect(state.pianoRoll.interaction.type).to.equal('idle');
  });
  
  it('should move selected events', () => {
    // Test moving logic
  });
  
  it('should resize events from edge', () => {
    // Test resizing logic
  });
  
  it('should create events in pencil mode', () => {
    // Test creating logic
  });
  
  it('should delete events in eraser mode', () => {
    // Test deleting logic
  });
});
```

## Test Utilities

### Interaction Simulator
Create a helper to simulate complete interactions:

```javascript
// test/piano-roll/helpers.js
export const simulateDrag = (actions, initialState, {start, end, steps = 10}) => {
  let state = initialState;
  
  // pointerDown
  state = actions.pianoRoll.pointerDown(start)(state);
  
  // pointerMove steps
  const deltaX = (end.x - start.x) / steps;
  const deltaY = (end.y - start.y) / steps;
  for (let i = 1; i <= steps; i++) {
    state = actions.pianoRoll.pointerMove({
      x: start.x + deltaX * i,
      y: start.y + deltaY * i
    })(state);
  }
  
  // pointerUp
  state = actions.pianoRoll.pointerUp(end)(state);
  
  return state;
};

export const simulateClick = (actions, initialState, position) => {
  return simulateDrag(actions, initialState, {
    start: position,
    end: position,
    steps: 1
  });
};
```

## Setup

### package.json additions
```json
{
  "scripts": {
    "test": "mocha 'test/**/*.test.js'",
    "test:watch": "mocha 'test/**/*.test.js' --watch"
  },
  "devDependencies": {
    "mocha": "^10.0.0",
    "chai": "^4.3.0"
  }
}
```

### Test Configuration
```javascript
// test/setup.js (if needed)
// Minimal setup - no DOM needed for pure function tests
```

## Testing Strategy by Phase

### Phase 1: Selection System
- Test `pointerDown` sets correct interaction type
- Test `pointerMove` updates selection rectangle
- Test `pointerUp` finalizes selection
- Test selection computation (which events are selected)
- Test single click selection
- Test deselection

### Phase 2: Moving Events
- Test grid position calculation
- Test event position updates
- Test multiple event movement
- Test grid snapping

### Phase 3: Resizing Events
- Test edge detection
- Test duration updates
- Test grid snapping for duration
- Test multiple event resizing

### Phase 4: Creating Events
- Test event creation on click
- Test event creation on drag
- Test grid positioning
- Test duration setting

### Phase 5: Deleting Events
- Test event deletion
- Test selection cleanup after delete

### Phase 6: Polish
- Test cursor changes (if state-based)
- Test visual feedback state

## Benefits

1. **Fast feedback** - Tests run quickly
2. **Easy debugging** - Pure functions are easy to test
3. **No DOM complexity** - Focus on logic
4. **Works with functional architecture** - Tests actions as state transformers
5. **Easy to extend** - Add tests as features are added

## Limitations

- Doesn't test actual DOM events
- Doesn't test canvas rendering
- Doesn't test RxJS observable chains (would need integration tests)

## Future Enhancements

- Add integration tests for services (with JSDOM if needed)
- Add visual regression tests (optional)
- Add E2E tests with Playwright (optional, for full app testing)

