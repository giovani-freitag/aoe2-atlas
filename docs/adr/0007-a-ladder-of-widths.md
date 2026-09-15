# 0007 — A ladder of widths, and panels that always overlay

*Accepted, 15 September 2026. Supersedes the single-breakpoint rule in
[the phone layout](../phone-layout.md), and corrects [0003](0003-panels-are-not-portalled.md).*

## Context

The atlas turned at one width, deliberately: if every part changes shape at the same pixel then
no two of them can disagree about which layout they are in. The reasoning is sound. The result
was not, and measuring it said so plainly.

With the preferences open:

| width | map | roster | preferences | map left in view |
| --- | --- | --- | --- | --- |
| 360–959 | full | overlay | overlay | **nothing — covered end to end** |
| 960 | 640 | 320, docked | 352, over the map | **288** |
| 1024 | 704 | 320, docked | 352, over the map | 352 |
| 1440 | 1120 | 320, docked | 352, over the map | 768 |

Two faults, both from the same cause. Between a phone and that one width — seven hundred pixels
of it — the atlas kept a phone's arrangement, so opening the filters on a tablet covered a map
there was ample room to stand beside. And at the width itself two columns arrived at once and
left the map narrower than either of the panels flanking it.

A third fault came with them: a panel laid over everything hid the year rail, which is the axis
every reading on the map is qualified by.

## Decision

**Bootstrap's ladder**, in rem — 36, 48, 62, 75, 87.5 — because it is the scale a reader of this
stylesheet is most likely to already know. One source of truth in `react/breakpoints.ts`, and an
architecture test that fails if a stylesheet turns at any other width.

**A panel is always laid over the map, never a column of it.** The map keeps the full width of
the window at every step, and its projection never changes when a panel opens: docking shifted
the whole world sideways every time the list came out.

What changes, and where:

| step | | |
| --- | --- | --- |
| xs | below 36rem | map full screen; panels take the whole side and make the rest inert; the year is hidden while one is open, because there is nowhere else for it to be |
| sm | 36rem | the header pill unfolds into the band it was a folded copy of, and the panel stops covering: it sits below the band and above the rail, and the map and the year stay live behind it |
| md | 48rem | a civilization stops being a bar over the year and becomes a panel beside the map; the map keeps its own controls while a panel is open |
| lg | 62rem | the roster is out to begin with; pointer-sized controls, and what was revealed on hover starts hiding until hovered |
| xl, xxl | 75rem, 87.5rem | held in reserve; nothing turns here yet |

## Consequences

At 1024 with both panels out the map keeps 672 pixels instead of 352, and at 700 it keeps all of
them instead of none. The year rail is only ever covered on a phone.

The fear behind the single width is real and is now answered by construction rather than by
restraint: the steps are declared once, the hooks name the step they turn at rather than a
number, and a test holds the stylesheets to the ladder. Parts of the atlas change at different
widths on purpose, and cannot do so by accident.

What this costs: the desktop loses its three-column layout, which was the arrangement the atlas
was designed around and is described throughout the phone-layout notes. The roster is now a panel
that covers part of the map rather than a column beside it.

**And a correction.** [0003](0003-panels-are-not-portalled.md) claimed that making modality a
prop ended the class of bug where a panel carried down to a phone width kept the wrong mode. Half
of that was wrong. The platform's modal dialog did two things at once — it made the rest inert
*and* it rode a layer above every `z-index` on the page. The primitive that replaced it does only
the first, so a modal panel had to be told to paint over the furniture, and until it was, the
year rail showed through the panel that was covering the map.
