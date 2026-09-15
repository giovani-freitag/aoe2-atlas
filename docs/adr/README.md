# Decisions

One file per decision that shaped the front end, in the order they were taken. An ADR is written
when a choice closes off a reasonable alternative — not for every change, and never as a summary
of what the code already says plainly.

Each records the state of the world at the time. A decision that is later reversed keeps its file
and gains a superseding one, because the reasoning is the part worth keeping: most of the cost of
a bad idea is spent rediscovering why it was dropped.

Search-visibility decisions live in [search-visibility.md](../search-visibility.md), which
predates this folder and is a fuller record than an ADR would be. The e2e suite asserts the ones
that are invisible in the source.

| | Decision | Status |
| --- | --- | --- |
| [0001](0001-layers.md) | Domain and services in plain classes, React behind hooks | accepted |
| [0002](0002-radix-primitives.md) | Shared primitives behind an in-house `ui/` layer | accepted |
| [0003](0003-panels-are-not-portalled.md) | The panels are not portalled | accepted |
| [0004](0004-interface-state-stays-a-reducer.md) | Interface state stays a reducer | accepted |
| [0005](0005-measured-regression.md) | Regression is measured, not diffed as pixels | accepted |
| [0006](0006-what-loads-first.md) | Vendor chunks split, preferences deferred | accepted |
