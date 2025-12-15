# Jam-Station Roadmap & General Outlook

**Date:** 2025-12-15  
**Status:** Planning

## Overview

This document outlines the general direction and planned improvements for jam-station, focusing on transforming it into a comprehensive live performance groovebox with DAW-like capabilities. The vision is to create a powerful, mobile-friendly music production and performance tool that integrates features from other apps in the ecosystem.

## Core Vision

**Jam Station** - A groovebox and DAW-like application focused on **live performance** with:
- Mobile-friendly interface (tablet and phone optimized)
- Groovebox features for live jamming
- DAW-like functionality for composition
- Seamless integration of features from other apps (js-loop-station, xAmplR, mega-synth)
- Live coding capabilities integrated with audio engine
- Enhanced connectivity (MIDI, control devices, networking)

---

## 1. Interface & Layout Improvements

### 1.1 Mobile-Friendly Design
**Priority:** High  
**Status:** Pending

**Goals:**
- Responsive layout that adapts to different screen sizes
- Touch-optimized interactions for mobile devices
- Gesture support for common actions
- Optimized UI elements for finger-based interaction

**Implementation:**
- Responsive CSS/SASS breakpoints
- Touch event handlers alongside pointer events
- Larger hit areas for mobile
- Swipe gestures for navigation
- Pinch-to-zoom for detailed views

### 1.2 Tablet vs Phone Screen Optimization
**Priority:** High  
**Status:** Pending

**Tablet Screen:**
- Multi-panel layout (similar to desktop)
- Full feature set visible
- Drag-and-drop interactions
- Multi-touch gestures
- Stylus support (optional)

**Phone Screen:**
- Simplified, focused interface
- Tab-based navigation
- Single-panel focus mode
- Essential controls only
- Swipe-based navigation
- Bottom navigation bar for quick access

**Implementation:**
- Device detection and layout switching
- Conditional rendering based on screen size
- Separate layout configurations
- Touch gesture library integration

### 1.3 Dark Theme
**Priority:** Medium  
**Status:** Pending

**Goals:**
- System theme detection (light/dark)
- Manual theme toggle
- Consistent dark theme across all UI components
- Proper contrast ratios for accessibility
- Theme persistence (localStorage)

**Implementation:**
- CSS variables for theme colors
- Theme switching mechanism
- Update all SASS files for dark theme support
- Test contrast ratios (WCAG compliance)

### 1.4 Better Layout Options & Interactions
**Priority:** Medium  
**Status:** Pending

**Common Layout Modes:**
- **Performance Mode**: Optimized for live performance (large controls, minimal distractions)
- **Composition Mode**: Full DAW-like interface (tracks, timeline, detailed editing)
- **Groovebox Mode**: Pattern-based workflow (sequencer, patterns, scenes)
- **Mix Mode**: Focus on mixing and effects (mixer view, sends, returns)
- **Sampling Mode**: Sample editing and management (waveform editor, sample library)

**Layout Features:**
- Customizable panel arrangements
- Save/load layout presets
- Quick layout switching
- Panel resizing and docking
- Collapsible panels
- Full-screen modes for specific views

**Implementation:**
- Layout management system
- Panel component architecture
- Layout persistence
- Quick-switch UI (keyboard shortcuts or buttons)

---

## 2. Feature Improvements & Integration

### 2.1 Improved Synth Engine
**Priority:** High  
**Status:** Planning (mega-synth exploration)

**Current State:**
- Basic synthesis capabilities
- Uses `iblokz-audio` library

**Goals:**
- Enhanced synthesis engine (explore in mega-synth app)
- More oscillator types
- Advanced modulation (LFO, envelopes, matrix)
- **Improved effects chain** - Better routing and chaining of effects
- **Patchability** - Modular patching system for audio routing
- Effects integration (delay, reverb, and more)
- Performance optimizations
- Real-time parameter control

**Related Project:**
- **mega-synth**: Dedicated app for exploring advanced synthesis, effects, and patching
- Extract and integrate proven concepts into jam-station
- Delay effect will be explored in mega-synth (currently UI exists but not used)

**Implementation:**
- Research and prototype in mega-synth
- Extract synthesis engine improvements
- Develop effects chain and patching system
- Integrate into jam-station audio engine
- Maintain compatibility with existing patches

### 2.2 Expanded Session Management
**Priority:** High  
**Status:** Pending

**Current Limitations:**
- Limited track count
- Basic track management

**Goals:**
- Support for many tracks (50+)
- Track grouping and folders
- Track templates
- Track color coding
- Track visibility toggles
- Track solo/mute improvements

**Looper Tracks:**
- Reference: js-loop-station, Ableton Live, Bitwig
- Real-time looping capabilities
- Multiple loop layers
- Loop quantization
- Loop recording modes (overdub, replace, multiply)
- Loop synchronization
- Loop scenes/arrangements

**Implementation:**
- Refactor track management system
- Add looper track type
- Integrate loop recording engine
- UI for loop management
- Scene/arrangement system

### 2.3 Better Sampling & Expanded Media Library
**Priority:** High  
**Status:** Pending

**Current State:**
- Basic sample playback
- Limited media library

**Goals:**
- **File Support:**
  - Drag-and-drop sample files (WAV, AIFF, MP3, OGG)
  - Support ZIP files with multiple samples (auto-extract)
  - Batch import
  - File format conversion

- **Free-Sound Integration:**
  - Reference: xAmplR implementation
  - Search and download from freesound.org API
  - Preview before download
  - Automatic tagging and organization
  - Attribution handling

- **Media Library Improvements:**
  - Advanced search and filtering
  - Tagging system
  - Sample preview
  - Sample organization (folders, playlists)
  - Sample metadata (BPM, key, length)
  - Sample editing (trim, normalize, fade)

**Implementation:**
- File drop zone component
- ZIP extraction library
- Freesound API integration
- Enhanced media library UI
- Sample metadata extraction
- Integration with existing sampler

### 2.4 Audio Wave Editor
**Priority:** Medium  
**Status:** Pending (may implement in xAmplR first)

**Goals:**
- Waveform visualization
- Sample editing (cut, copy, paste, trim)
- Fade in/out
- Normalize
- Reverse
- Time-stretch/pitch-shift
- Loop point editing
- Zoom and navigation

**Implementation Strategy:**
- Prototype in xAmplR first
- Extract as reusable component/library
- Integrate into jam-station
- Consider `iblokz-audio` library extension

### 2.5 Better Connectivity
**Priority:** High  
**Status:** Pending

**MIDI Improvements:**
- Better MIDI device detection
- MIDI device management UI
- MIDI channel routing
- MIDI clock sync (master/slave)
- MIDI learn mode improvements
- MIDI CC mapping enhancements
- MIDI program change support

**Other Control Devices:**
- OSC (Open Sound Control) support
- WebSocket connectivity
- Network synchronization
- Remote control capabilities
- Multi-device setups

**MIDI Mapping:**
- Visual MIDI mapping interface
- MIDI mapping presets
- MIDI mapping export/import
- Per-device mapping profiles
- MIDI mapping templates

**Implementation:**
- Enhanced MIDI device management
- OSC library integration
- WebSocket server/client
- MIDI mapping UI component
- Configuration persistence

### 2.6 Traditional DAW Tracks Display (Optional)
**Priority:** Low  
**Status:** Under Consideration

**Goals:**
- Timeline-based track view
- Horizontal arrangement of tracks
- Track lanes
- Automation lanes
- Region editing
- Timeline scrubbing

**Considerations:**
- May conflict with groovebox workflow
- Evaluate user needs
- Could be optional view mode
- May be better suited for composition mode

**Decision:** TBD based on user feedback and usage patterns

---

## 3. Mobile & Desktop App Builds

### 3.1 Multiplatform Framework Evaluation
**Priority:** Medium  
**Status:** Research Phase

**Options:**
- **Electron**: Desktop apps (Windows, macOS, Linux)
- **Capacitor**: Mobile apps (iOS, Android) + Desktop
- **Tauri**: Lightweight alternative to Electron
- **PWA**: Progressive Web App (works everywhere)
- **Hybrid Approach**: Different frameworks for different platforms

**Considerations:**
- Performance requirements (real-time audio)
- Native audio engine integration
- File system access
- Platform-specific features
- Development and maintenance overhead

### 3.2 JUCE Integration (Optional)
**Priority:** Low  
**Status:** Research Phase

**Goals:**
- Native audio engine using JUCE
- Common wrapper on top of JUCE and Web Audio
- Better performance for audio processing
- Lower latency
- Native plugin support

**Considerations:**
- Significant architecture changes
- C++ development required
- Web Audio API compatibility
- Cross-platform compilation
- May be overkill for current needs

**Decision:** Evaluate after performance testing and user feedback

### 3.3 Build Pipeline
**Priority:** Medium  
**Status:** Pending

**Requirements:**
- Automated builds for all platforms
- CI/CD integration
- Code signing for distribution
- App store submissions (iOS App Store, Google Play, etc.)
- Desktop distribution (direct download, package managers)

**Implementation:**
- GitHub Actions workflows
- Build configuration for each platform
- Automated testing
- Release management

---

## 4. Live Performance Focus

### 4.1 Groovebox Features
**Priority:** High  
**Status:** In Progress

**Current Features:**
- Pattern-based sequencing
- Session management
- Piano-roll editing

**Enhancements:**
- **Scenes**: Save and recall complete session states
- **Pattern Chains**: Arrange patterns in sequences
- **Live Recording**: Record performances in real-time
- **Performance Controls**: Large, touch-friendly controls
- **Quick Access**: One-tap access to essential functions
- **Visual Feedback**: Clear indication of current state

**Implementation:**
- Scene management system
- Pattern chain editor
- Performance mode UI
- Large control components
- State visualization

### 4.2 DAW-Like Functionality for Live Performance
**Priority:** Medium  
**Status:** Pending

**Goals:**
- Enhance live performance without sacrificing immediacy
- Quick editing during performance
- Real-time parameter automation
- Effect automation
- Mix automation
- Performance-friendly editing tools

**Balance:**
- Maintain groovebox immediacy
- Add power-user features without complexity
- Context-aware UI (simple by default, powerful when needed)

### 4.3 Live Coding Mode
**Priority:** Low  
**Status:** Research Phase

**Goals:**
- Seamless integration with audio engine and UI
- Real-time code execution
- Visual code editor
- Code snippets library
- Parameter binding from code
- Live code sharing/collaboration

**Considerations:**
- Language choice (JavaScript, Lua, custom DSL?)
- Security implications
- Performance impact
- User experience (should feel natural, not intimidating)
- Integration with existing architecture

**Implementation:**
- Code editor component
- Sandboxed execution environment
- API for audio engine access
- Visual feedback for code execution
- Error handling and debugging

### 4.4 Connectivity for Live Performance
**Priority:** High  
**Status:** Pending

**Goals:**
- **MIDI Sync**: Master/slave clock synchronization
- **Network Sync**: Multi-device synchronization
- **Remote Control**: Control from other devices
- **Live Streaming**: Stream audio/video output
- **Collaboration**: Multiple performers, shared sessions
- **Backup**: Real-time session backup to cloud

**Implementation:**
- MIDI clock implementation
- Network synchronization protocol
- WebSocket server for remote control
- Streaming integration
- Collaboration features
- Cloud backup service integration

---

## Integration Strategy

### App Ecosystem Integration

**js-loop-station:**
- Looper track implementation
- Loop recording patterns
- Scene management concepts

**xAmplR:**
- Freesound integration
- Sample management patterns
- Wave editor (if implemented there first)

**mega-synth:**
- Advanced synthesis engine
- Modulation concepts
- Performance optimizations

**General Approach:**
1. Explore and prototype in dedicated apps
2. Extract proven concepts and patterns
3. Integrate into jam-station
4. Maintain consistency across apps
5. Share common libraries (iblokz-*)

---

## Implementation Phases

### Phase 1: Foundation (Short-Term)
- Mobile-friendly interface improvements
- Dark theme
- Basic layout modes
- Enhanced connectivity (MIDI improvements)
- Expanded session management (more tracks)

### Phase 2: Feature Integration (Mid-Term)
- Looper tracks
- Improved sampling (file drop, ZIP support)
- Freesound integration
- Performance optimizations
- Tablet/phone specific layouts

### Phase 3: Advanced Features (Long-Term)
- Advanced synth engine (from mega-synth)
- Wave editor
- Live coding mode
- Multiplatform builds
- JUCE integration (if needed)

### Phase 4: Polish & Performance (Ongoing)
- Performance optimization
- User experience refinement
- Bug fixes and stability
- Documentation
- Community feedback integration

---

## Success Metrics

- **Usability**: Intuitive interface, minimal learning curve
- **Performance**: Low latency, smooth real-time operation
- **Portability**: Works well on mobile, tablet, and desktop
- **Feature Completeness**: Covers groovebox and DAW use cases
- **Live Performance**: Reliable for live shows and jamming
- **Integration**: Seamless feature integration from other apps

---

## Notes

- Prioritize based on user feedback and actual usage
- Maintain focus on live performance while adding composition features
- Keep groovebox immediacy while adding power-user features
- Regular testing on actual devices (not just desktop browsers)
- Consider community contributions and open-source collaboration
- Document architecture decisions for future maintainability

---

## Related Projects

- **js-loop-station**: Looper functionality reference
- **xAmplR**: Sampling and media library reference
- **mega-synth**: Advanced synthesis exploration
- **iblokz-audio**: Audio engine library
- **iblokz-gfx**: Graphics utilities
- **iblokz-data**: Data manipulation utilities
- **iblokz-state**: State management

---

## Related Planning Documents

- `2025-12-15-01-piano-roll-improvements.md` - Piano-roll specific improvements
- `2025-12-07-02-piano-roll-interaction-port.md` - Piano-roll interaction port (completed)
- `2025-12-07-03-piano-roll-ui-testing.md` - Piano-roll UI testing (completed)

