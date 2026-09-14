# The shape of the atlas on a phone

A map is the whole point, so nothing in this interface is allowed to sit on top of one for
longer than a reader asked it to. That single rule produced every arrangement below, and the
measurements are how each one was settled.

## Where things are

| | Phone | Desktop |
| --- | --- | --- |
| The map | the whole screen, edge to edge | the middle column |
| The year | a band at the foot, always out | a band at the foot, always out |
| What is on the map | a drawer from the right | a column on the right |
| How it is drawn | a drawer from the left | a drawer from the left |
| One civilization | a bar over the year rail, one panel at a time | a panel docked on the left |
| The legend | a pill at the head of the map, unfolding on a tap | a card in the corner |
| The atlas itself | a pill at the head of the map | a band along the top |

Three questions, three places, and the same three sides at either size. What is on the map comes
in from the right, how it is drawn comes in from the left, and when — the axis every reading on
the map is qualified by — is along the foot where a thumb already is.

Everything turns at one width, the one `useWideScreen` names, and there is no second breakpoint
anywhere in the stylesheets. Every part of the atlas changes shape at the same pixel, so no two
of them can disagree about which layout they are in.

## The civilization, as a deck

Opening a civilization raises a bar rather than a sheet: the arms, the name where there is room
for it, one thumb-sized button per category, and a way out. A tap lifts that category over the
map and a second tap puts it away, so the reader decides how much ground to cover and for how
long, one question at a time.

| State | Map covered |
| --- | --- |
| Bar alone | 8% |
| Contemporaries open | 23% |
| Expansion open | 26% |
| Wonder open | 32% |
| Realm open | 45% |

<p align="center">
  <img src="phone.png" alt="A phone with the Byzantines open: the map above, the realm panel over the foot, the deck bar and the year rail below it" width="320">
</p>

No panel may take more than a third of the screen's height; past that it scrolls. The map is
shorter than the screen — the year's band is under it — so even the longest panel, the realm's,
stops at a little under half of it. A panel that describes how much ground a realm held has to
leave that ground in view: it is the thing the reader opened it to measure the claim against.

The bar slides out of the year's own band and tucks back under it. The year is what everything
else is measured against, so it is the thing that casts a shadow rather than the thing covered.

## What the panels say

Two panels describe the same civilization, one docked at the side of a desktop and one over the
foot of a phone, and they draw their words from one place rather than keeping a copy each. A copy
is a standing promise to change both, and the second one is the one that gets forgotten.

| Shared | Lives in |
| --- | --- |
| The realm's facts, the Wonder's, the expansion's | `civ-facts.tsx` |
| Who counts as a contemporary, and how many is too many | `contemporaries.ts` |
| The neighbours, packed as arms or named in rows | `rivals.tsx` |
| A civilization's arms | `civ-arms.tsx` and `assets.ts` |

Tapping a neighbour traces that realm and gets the panel out of the way, because "they shared
forty per cent of your ground" is a claim about a shape, and the shape is the answer.

## The year

One bar of the histogram is lit rather than the whole run up to it. The bars read how crowded
each century was, and that reading stands alone for each: the centuries do not accumulate, and
every one of them is its own map, complete in itself.

The columns are a target as well as a reading: pointing at the tall bar picks that century. The
handle is drawn rather than left to the browser, so its width is a number the stylesheet knows,
and everything painted behind the slider lands on exactly the positions the handle can reach.
Measured drift between a column's middle and the handle that selects it: under half a pixel at
either end of the rail.

The fire is below the screen, loosed across the whole rail with its glow laid along the bottom
edge. It belongs to the band and not to any control in it, so it reads as what it is: a light
thrown up from under the last band of the atlas.

## How it is checked

`npm test` covers the rules underneath — the share formatter, who counts as a contemporary, and
the framing maths with a panel over one side or the foot. The layout itself is checked by driving
a real browser at twelve widths from 360 to 1920, each with a realm traced and a civilization
open, asking at each one whether the legend shares ground with the deck, the panel, the controls,
the pill or the rail, whether the page overflows sideways, and whether any text is clipped.

The one a phone is apt to lose is the `h1`. The wordmark shrinks to a pill the size of two
buttons, and the heading has to go on standing behind it in the accessibility tree.

Flights honour `prefers-reduced-motion`, and they have to ask for themselves. Cutting every CSS
transition and animation does not reach them: a flight across the map is neither of those but d3
interpolating a transform sixty times a second, so it is asked separately and jumps instead.
