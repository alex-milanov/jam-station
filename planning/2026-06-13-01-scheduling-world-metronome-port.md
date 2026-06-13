# Scheduling & Sequencing Rework (World-Metronome Approach)

**Date:** 2026-06-13

**Reference implementation:** `world-metronome/src/js/services/audio.js`, `world-metronome/src/js/util/math.js`, `world-metronome/src/js/util/audio/scheduler/index.js`

**Reference docs:** `world-metronome/summaries/2025-02-14-02-latency-research-and-ui-sync.md`, `world-metronome/CHANGELOG.md`

---

## Problem statement

Jam-station uses a **tick-as-state** model: `clock.js` drives `setTimeout` → `actions.studio.tick(time)` → increments `elapsed`/`index`/`bar` in state → consumers react. This causes dual time bases, bar-edge-only scheduling, per-16th-note reducer churn, and MIDI/audio clock mismatch.

World-metronome uses **anchor-and-derive**: store `startTime` + `cycleOffset`, compute position from `context.currentTime` each frame, schedule audio ahead via `projection()`.

---

## Target architecture

**Core principle:** `AudioContext.currentTime` is the single timing authority. State holds anchors and parameters only; position and scheduling are computed.

### Jam-station clock mapping

Use `segments = beatLength`, `modifier = 1` (16th-note grid stored directly as `studio.beatLength`).

| Concept | Jam-station equivalent |
|---------|------------------------|
| Full bar duration | `bpmToTime(bpm) * beatLength` |
| Step duration | `bpmToTime(bpm)` (16th note) |
| Cycle index | `calculateCycle(...)` mod `sequencer.barsLength` |
| Progress 0–1 | position within current bar |

---

## Implementation phases

### Phase 1 — Utilities and time frame
- CommonJS `util/scheduler.js`, `util/time.js`, `util/position.js`
- Re-anchor on bpm/measure change in studio actions

### Phase 2 — Scheduler service
- RAF loop with `latestScheduledCycle` + `projection()` for seq/piano events
- Remove bar-edge block from `audio/index.js`

### Phase 3 — Retire old clock
- Replace `clock.js`; migrate MIDI clock out and step recording

### Phase 4 — Transport / derived playhead
- `transport` service syncs derived `studio.tick` for UI at ~15fps

### Phase 5 — Bug fixes
- Pause/resume re-anchor, MIDI timing, live sampler scheduling

---

## Success criteria

1. No `setTimeout` in the transport/clock path.
2. Audio scheduling uses `projection()` + absolute `AudioContext` times.
3. `startTime` / `cycleOffset` handle mid-play tempo changes without dropping steps.
4. `studio.tick` is derived, not incremented.

---

## Out of scope

- MIDI clock master/slave sync
- Unifying `sequencer.pattern` with `track.measures[].pattern`
- Bluetooth output latency UI compensation
- Tap tempo integration with anchor model
