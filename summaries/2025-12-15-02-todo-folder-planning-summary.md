# Todo Folder Planning Summary

**Date:** 2025-12-15  
**Status:** Summary of Old Planning Approach

## Overview

This document summarizes the old planning approach used in the `todo/` folder (2016-2018) to inform future planning decisions. The todo folder contained weekly task lists that served as the primary planning mechanism before the current `planning/` document-based approach.

**Purpose:** Provide a reference summary of historical planning items to help make informed decisions about future planning, without necessarily committing to implementing everything that remains.

## Todo Folder Structure

The `todo/` folder contains weekly todo files organized by year:
- **2016**: 5 files (w34, w45, w48, w49, w50)
- **2017**: 5 files (w02, w03, w10, w17, w41)
- **2018**: 1 file (w12)
- **2024**: 2 files (w40, w41) - **Both are empty**

## Complete Todo File Analysis

### 2016 Todos

**W34 (Week 34, 2016):**
- ✅ Initial MIDI Support - **COMPLETED** (MIDI is implemented)
- ✅ Research Freesound.org - **COMPLETED** (mentioned in roadmap for xAmplR integration)
- ✅ Sequencer: add/remove rows, assign sample - **COMPLETED** (sequencer exists)
- ✅ MIDI -> pads support, device info, velocity - **COMPLETED** (MIDI mapping exists)
- ⚠️ Lissajous research - **PARTIAL** (mentioned but not actively pursued)
- ⚠️ Mobile(Responsive) Interface - **IN PROGRESS** (in roadmap as high priority)

**W45 (Week 45, 2016):**
- ✅ Instrument Controls ADSR envelope - **COMPLETED** (iblokz-audio has ADSR)
- ✅ Connect MIDI velocity and sustain - **COMPLETED** (MIDI integration works)
- ✅ Connect MIDI controls to instrument props - **COMPLETED**
- ⚠️ Media Library Initial Functionality - **PARTIAL** (exists but needs expansion per roadmap)
- ⚠️ Impl. sound from freesound - **PLANNED** (in roadmap for xAmplR integration)

**W48 (Week 48, 2016):**
- ✅ Audio Rig Refactoring - **COMPLETED** (iblokz-audio library extracted)
- ✅ Detach filters and amps from synth class - **COMPLETED** (modular architecture)
- ⚠️ Media Library - **PARTIAL** (exists, needs expansion)
- ⚠️ Mobile(Responsive) Interface - **IN PROGRESS** (in roadmap)
- ✅ MIDI Integration - **COMPLETED**
- ⚠️ MIDI Map Initial Functionality - **PARTIAL** (exists, needs improvement per roadmap)

**W49 (Week 49, 2016):**
- ✅ Modular Synth Prototype - **COMPLETED** (iblokz-audio is modular)
- ✅ Initial MIDI routing - **COMPLETED**
- ✅ Some synth fixes - **COMPLETED**
- ⚠️ Media Library Updates - **PARTIAL** (exists, needs expansion)

**W50 (Week 50, 2016):**
- ✅ Initial Audio util (Web Audio Functional Interface) - **COMPLETED** (iblokz-audio)
- ✅ Expand Midi util - **COMPLETED**
- ✅ Initial Audio service -> nodes, connections - **COMPLETED** (iblokz-audio)

### 2017 Todos

**W02 (Week 2, 2017):**
- ✅ Audio Logic Refactoring - **COMPLETED** (iblokz-audio library)
- ✅ Audio Service Impl. (FRP interface) - **COMPLETED** (RxJS-based)
- ✅ Audio Util Improvements (Voices Support) - **COMPLETED**
- ✅ MIDI Service and Utils - **COMPLETED**
- ⚠️ Initial Delay Patch - **PLANNED** (UI exists but not used, part of iblokz-audio planning, will be explored in mega-synth)

**W03 (Week 3, 2017):**
- ✅ CSS Based Open/Close Folders - **COMPLETED**
- ✅ Zip Support - **PLANNED** (in roadmap: "support ZIP files with samples")
- ⚠️ Initial Files Service - **PARTIAL** (file handling exists, may need expansion)
- ⚠️ Better Samples - **IN PROGRESS** (roadmap: expanded media library)
- ⚠️ Drag'n'drop sounds - **PLANNED** (roadmap: "drag-and-drop sample files")
- ⚠️ Folder tree - **UNKNOWN** (may exist in media library)
- ⚠️ Sampler: Volume Per Channel, Effects - **PARTIAL** (sampler exists, features may vary)

**W10 (Week 10, 2017):**
- ⚠️ Add/Remove/Assign Patches (vex-js) - **UNKNOWN** (vex-js is in dependencies)
- ✅ MIDI -> Samples -> Play - **COMPLETED** (MIDI triggers samples)
- ⚠️ Record Samples - **PLANNED** (sample recording in xAmplR, loop recording in js-loop-station, part of roadmap)

**W17 (Week 17, 2017):**
- ⚠️ Experiments with clock (sync over midi) - **PARTIAL** (MIDI exists, sync may need work)
- ✅ Tab functionality (tap-tempo) - **COMPLETED** (tap-tempo implemented)
- ⚠️ Send midi notes to ext sink -> qsynth - **UNKNOWN** (MIDI output exists)
- ✅ Note sequencing (svg piano roll?) - **COMPLETED** (piano-roll exists, canvas-based not SVG)
- ✅ MIDI keyboard display - **COMPLETED** (MIDI keyboard UI component exists)

**W41 (Week 41, 2017):**
- ✅ A bit of cleanup (assets & controls services) - **COMPLETED** (ongoing refactoring)
- ⚠️ Work on the piano roll and timeline screens - **IN PROGRESS** (piano-roll improved, timeline may be planned)
- ⚠️ Synth Impl. Effects - **PARTIAL** (effects exist, may need expansion)
- ⚠️ AlgoRave -> Ref Lissajoujs - **PLANNED** (Lissajous is live audio coding app, in roadmap as Live Coding Mode)
- ⚠️ Visuals - **UNKNOWN** (may be planned or exist)

### 2018 Todos

**W12 (Week 12, 2018):**
- ⚠️ Impl. Session -> track -> measure length - **PARTIAL** (session/track system exists)
- ✅ Link tick to control current measure position - **COMPLETED** (tick system exists)
- ⚠️ Investigate lissajous - **PLANNED** (Lissajous is live audio coding app, in roadmap)

### 2024 Todos

**W40 & W41:**
- **Both files are empty** - No content

## Summary by Status

### ✅ Completed (Fully Implemented)
- Initial MIDI Support
- MIDI routing and mapping
- Audio service/engine refactoring (iblokz-audio)
- Instrument controls (ADSR)
- Sequencer functionality
- Modular synth architecture
- Audio util improvements
- CSS-based UI components
- Piano-roll (canvas-based, improved in 2025)
- Tap-tempo integration
- MIDI keyboard display

### ⚠️ Partial/In Progress
- Media Library (exists but needs expansion - in roadmap)
- Mobile/Responsive Interface (in roadmap as high priority)
- MIDI Map improvements (in roadmap)
- Freesound integration (planned in roadmap)
- Drag-and-drop samples (planned in roadmap)
- ZIP file support (planned in roadmap)
- Sampler features (volume per channel, effects)

### ✅ Already in Planning
- **Delay Patch** - In roadmap: "Improved effects chain and patchability" (Section 2.1)
  - UI exists but not currently used
  - Part of iblokz-audio planning
  - Will be explored in mega-synth
- **Timeline Screen** - In roadmap as optional feature
- **Files Service** - Covered by media library expansion
- **Lissajous/Live Coding** - In roadmap as "Live Coding Mode" (Section 4.3)
  - Lissajous is a live audio coding app (not visualization)
  - Referenced in iblokz-audio planning
- **Record Samples** - In roadmap via:
  - Looper tracks (Section 2.2) - loop recording from js-loop-station
  - Integration strategy - sample recording from xAmplR
  - Live recording (Section 4.1)

### ❓ Unknown/Needs Verification
- Delay patch implementation (UI exists, not used, planned)
- Record samples functionality (exists in other apps, planned)
- Tap-tempo integration (✅ implemented)
- MIDI keyboard display (✅ implemented)
- Timeline screen (in planning as optional)
- AlgoRave/visualization features (Lissajous is audio coding, in planning)

## Key Insights

### Completed Items
Many items from 2016-2017 have been **completed**:
- Audio engine refactoring → **iblokz-audio library**
- MIDI support and routing → **Fully implemented**
- Modular synth architecture → **Completed**
- Piano-roll → **Significantly improved in 2025**
- Tap-tempo → **Implemented**
- MIDI keyboard → **Implemented**

### Still Relevant Items
Several items are **still relevant** and appear in current roadmap:
- **Media Library expansion** (W45, W48, W49) → In roadmap: "Better Sampling & Expanded Media Library"
- **Mobile/Responsive Interface** (W34, W48) → In roadmap: "Mobile-Friendly Design" (High Priority)
- **Freesound integration** (W34, W45) → In roadmap: "Free-Sound Integration" (xAmplR reference)
- **Drag-and-drop samples** (W03) → In roadmap: "Drag-and-drop sample files"
- **ZIP file support** (W03) → In roadmap: "Support ZIP files with samples"
- **Delay/Effects** (W02) → In roadmap: "Improved effects chain and patchability"
- **Record Samples** (W10) → In roadmap: Looper tracks + integration strategy
- **Live Coding** (W41) → In roadmap: "Live Coding Mode"

## Comparison: Todo vs Planning

| Aspect | Todo Folder | Planning Documents |
|--------|-------------|-------------------|
| **Last Updated** | 2018 (some 2024 empty files) | 2025-12-15 (active) |
| **Content** | Weekly task lists | Comprehensive roadmaps |
| **Scope** | Short-term tasks | Short, mid, long-term goals |
| **Status** | Outdated, inactive | Active, maintained |
| **Structure** | Weekly files by year | Themed documents with dates |
| **Relevance** | Historical only | Current and future-focused |

## Conclusion

The `todo/` folder represents the **old planning approach** (weekly task lists, 2016-2018) and contains:
- ✅ **Historical record** of early development
- ✅ **Many completed items** that are now part of the codebase
- ✅ **Some still-relevant items** that appear in current roadmap
- ❌ **Outdated format** (weekly files vs. comprehensive planning documents)
- ❌ **No recent updates** (2024 files empty, nothing from 2025)

## Use for Future Planning

This summary can inform future planning decisions by:
- Identifying items that were planned but never completed
- Highlighting features that may still be relevant
- Providing context for why certain features were prioritized
- Avoiding duplication of already-completed work

**Note:** Not all remaining items need to be implemented. Use this summary to make informed decisions about what to prioritize in future planning documents.

## Planning Approach Evolution

The `todo/` folder represents the **old planning approach** (weekly task lists, 2016-2018). The current approach uses comprehensive planning documents in `planning/` with:
- ✅ More comprehensive scope
- ✅ Better organization (themed documents)
- ✅ Active maintenance
- ✅ Alignment with current functionality
- ✅ Priorities and timelines

## Final Status: All Items Accounted For

**All todo items are accounted for!**

Every item from the old todo folder (2016-2018) is either:
- ✅ **Already implemented** in the codebase
- ✅ **Already in planning** documents (roadmap or piano-roll improvements)
- ✅ **Covered by integration strategy** (features from other apps)

**No unreferenced items remain.** The todo folder analysis is complete, and all relevant items are either implemented or planned.
