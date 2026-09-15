# 0002 — Shared primitives behind an in-house `ui/` layer

*Accepted, 15 September 2026.*

## Context

Every control on screen was built by hand out of the atlas's own materials, because the atlas is
parchment and brass and a native control is a grey system rectangle in the middle of it. The cost
was the behaviour that comes free with a native control and has to be put back by hand once it is
replaced: a hundred and fifteen lines reimplementing the keyboard for one list, a pair of vendor
pseudo-elements kept in step for one slider handle, thirty lines of measuring to keep a preview on
screen, a `details` element that reports nothing about its state to anything outside itself.

## Decision

Build on shared primitives, and keep them behind a layer of our own.

`radix-ui`, the unified package, and its **primitives only** — not Radix Themes, which ships a
design system that would spend the whole session fighting three thousand lines of skin.

Every primitive is wrapped in `react/ui/`. Components import from there; no file under
`components/` imports the library. The wrapper is where the atlas's vocabulary lives: a hover card
takes the *gap* it should stand off its anchor, not a `sideOffset` that silently has the arrow's
height added to it.

## Consequences

The keyboard, the focus handling and the collision behaviour are somebody else's problem now, and
better than what they replaced: the expansion chips gained roving tabindex, the panels gained a
modality that changes with the width instead of needing to be closed and reopened, and the
Wikipedia preview stopped being cut off by the panel it opened from.

It costs **119 kB raw, 37 kB gzipped** — twenty-two per cent of the bundle, and parsing is charged
by the raw byte. On a mid-range phone that is a measurable part of the four seconds before the
atlas is usable. It bought a great deal of behaviour and it is not free; see
[0006](0006-what-loads-first.md) for what was done about the part of it that can wait.

Swapping the library later means rewriting eight files in `ui/`, not every control in the atlas.
