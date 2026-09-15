# 0006 — Vendor chunks split, preferences deferred

*Accepted, 15 September 2026.*

## Context

First paint was never the problem: an inline-styled mark in `index.html` puts the atlas's own
colours on screen in well under a second on a slow connection. What a reader waits for is the map.

Measured against the built bundle, with the network and the processor throttled independently:

| | atlas usable |
| --- | --- |
| no throttling | 1.2 s |
| slow 4G only | 2.4 s |
| 4× CPU only | **3.9 s** |
| both | 5.3 s |

The processor costs more than the connection. Sampling the main thread to the first Wonder, about
half of it is spent parsing and evaluating script — a cost charged by the raw byte, which gzip
does nothing about.

## Decision

Split the vendors into their own chunks, and fetch the preferences panel only when it is opened.

Deprioritise what is not needed to draw the first map: the roster's fifty-six emblems load lazily
and at low priority, and the neighbouring centuries are warmed on an idle callback rather than the
instant the first century lands, where they were competing with the coastline.

## Consequences

Roughly four hundred milliseconds off the time to a usable map on a mid-range phone, and the
coastline arrives four hundred earlier because the emblems stopped queueing in front of it. The
vendor chunks also cache across deploys, which the single bundle could not: React and d3 change
far less often than the atlas does.

The panel behind a click is now a chunk of its own — ten kilobytes gzipped that a reader who never
opens the preferences never fetches. That is a modest saving for a `Suspense` boundary and a piece
of state remembering the panel was opened, and it was kept deliberately rather than because the
number demanded it.

What this does not fix: React, d3 and i18next are four hundred kilobytes of raw script that the
first map genuinely needs, and no amount of chunking makes them smaller. Cutting the wait further
means shipping less, not arranging it differently.
