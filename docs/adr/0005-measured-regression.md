# 0005 — Regression is measured, not diffed as pixels

*Accepted, 15 September 2026.*

## Context

Rebuilding every control on shared primitives had one acceptance criterion: the atlas should look
and behave exactly as it did. The obvious instrument is a screenshot diff, and it is the wrong
one here. The year rail has a canvas of embers burning under it and the realms are drawn in moving
hatch; a pixel diff reports a change on every run, and a check that always fails is a check nobody
reads.

## Decision

Two instruments, for two different jobs.

**`npm run compare`** drives two running builds through the same scenarios and compares **bounding
boxes and computed style, as numbers**, plus a set of behavioural assertions whose results are
compared as values. Screenshots are still written, with the fire masked, for a human to look at —
but nothing fails on them. This is a migration tool: it needs an old build to compare against.

**`npm run test:e2e`** is the standing regression suite, against one build. It asserts behaviour a
reader can name — the year moves, the list reorders, the map redraws — rather than which library
is underneath, so it survives the next change of primitive too. It also asserts the
search-visibility decisions that are invisible in the source.

## Consequences

The measured comparison earned its place immediately: it caught the Wikipedia preview opening on
the wrong side and a hundred and eighty-two pixels out of position, which no reviewer had spotted
by eye across two sessions of looking at it.

It also produces false alarms of its own kind, and they have to be read rather than trusted. Two
findings turned out to be bad assertions — a closed panel that is offscreen rather than hidden,
and two keystrokes sent in the same tick — and one turned out to be a pre-existing bug in the
build being compared *against*. A measurement says what differs, never which side is right.
