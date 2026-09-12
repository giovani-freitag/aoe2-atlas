# Spike: the civilization as a deck, not a sheet

Tried on `spike/mobile-deck`, kept local. `main` is untouched.

## What it is

Excalidraw's phone shape, applied to the civilization panel. Instead of a sheet that rises over
the map, a strip sits on the year rail carrying the arms, the name, one thumb-sized button per
category and a close. A tap lifts that category's panel over the map; a second tap on the same
button puts it away.

Categories are offered only when there is something behind them, so a civilization with no
expansion shows three buttons rather than four greyed out.

| Category | What is in it |
| --- | --- |
| Realm | the realm's name, area, border precision, span, provenance, peak and the jump to it |
| Contemporaries | who shared the ground, as a row; tapping one traces it and closes the panel |
| Wonder | the monument, its place, the Wikipedia link and the anachronism note |
| Expansion | which release it arrived in, and when |

## What it costs the map

Measured on an iPhone 13 viewport, as a share of the map area:

| State | Map covered |
| --- | --- |
| Bar alone | 8% |
| Contemporaries open | 27% |
| Wonder open | 32% |
| Realm open | 53% |

The sheet it would replace covers 34% at its peek and 88% at its tallest, and covers it whether
or not the reader is reading anything.

## What is good about it

- The map is one tap away at all times, and the tap is on the thing you already looked at.
- Reading one category never hides the others: the bar keeps them all on screen.
- The panel is as tall as its contents, so the Wonder does not reserve the room the Realm needs.
- Closing is a real button rather than a gesture, which the drag-to-dismiss sheet never had.

## What it breaks, unfixed in the spike

- ~~The legend collides with the bar.~~ Fixed: on a phone the legend moved to the head of the
  map, clear of the wind rose. On a wide screen it keeps the foot, where nothing disputes it.
- ~~The zoom controls are covered by an open panel.~~ Fixed: the deck publishes its height and
  the controls stand on top of it, sliding as panels open and close.
- **There is no close label in the bundles.** The spike borrows the panel's own label for the
  cross. A real one needs a key in all seventeen languages.
- **Nothing tells the reader the buttons are categories** before the first tap. Excalidraw gets
  away with this because its icons are tools; here an icon for "realm" is a guess.
- **Desktop is unchanged** — it keeps the docked panel, which is right, but it means two
  components describe the same civilization and can drift apart.

## Since the first pass

The bar runs edge to edge, the way a phone's toolbar does, with the civilization's colour as
the rule along its top. The name is gone: a toolbar is read by its buttons, and a word in the
middle of one only takes the room the buttons wanted. The arms stay on the left and carry the
identity, which is what they do everywhere else here.

The bar is glued onto the rail rather than floating above it, overlapping it by six pixels —
onto the rail's own top padding and no further, because any deeper and it starts eating the
year. The rail itself was trimmed from 93 to 83 pixels. Bar and rail together now stand 129
pixels tall against the 153 they did, and the sheet they replace stood 93 + its own 226.

## Two more passes

The legend folds. On a phone it is a pill — the layers mark, the count and a dot per region,
which is the legend in miniature — and a tap unfolds the panel under it. The pill stays as the
panel's head, carrying the fold and the "clear" beside it, so there is always a way back. On a
wide screen nothing changed: it sits in a corner and bothers nobody, so it stays open.

Every icon button is one size, and it is the small one. The atlas had three on one screen — 36
in the header, 44 on the map, 36 again in the deck — so the skin gained a token of its own for
them, apart from the control size. A control that holds text, or takes a finger dragging, still
earns the full thumb: fields, roster rows, the year's slider. A square with a picture in it does
not. Measured on a phone: header, map controls, deck tabs, deck close and the year arrows, all
36 by 36, and the header is back to 45 pixels tall.

The deck's categories sit together after the arms rather than spread across the bar. Spread out
they read as five unrelated things; grouped they read as one set, with the close alone at the
far end where a close belongs.

## A pass over every panel, measured

Driven through the harness on an iPhone 13 viewport, opening each panel in turn and measuring
what it costs. The panel heights before and after a density pass:

| Panel | Was | Now | Map covered |
| --- | --- | --- | --- |
| Realm | 243 px | 211 px | 47% |
| Wonder | 215 px | 178 px | 41% |
| Expansion | 95 px | 71 px | 21% |
| Contemporaries, one row | 61 px | 57 px | 18% |

Two things were doing it. The panel was leather with a parchment card inside — two frames, two
paddings and two borders around one paragraph, which on a phone was most of the height. It is
one surface now, a parchment sheet rising out of the toolbar, with the civilization's colour
along the seam. And the type inside was set for a document rather than for a glance over a map,
so the lead, the stats, the sources and the notes all came down a size.

The neighbour rows were full thumb-sized, 44 pixels, which made four of them taller than the
panel holding them. A row there is a reading with a switch behind it rather than a button in a
form, so it is now the height of what it shows: 32 pixels, with 20-pixel arms.

What the sweep also turned up, left alone:

- The roster's expansion chips are 28 pixels tall, under any reasonable target. They are the
  only controls in the atlas that small.
- A share that rounds to nothing prints as "0%", which reads as "they shared none" when it
  means "they shared a little". It wants a "<1%".
- The roster's rows are 44 pixels and 56 of them, which is right: that list is scrolled and
  tapped with a thumb.
- No clipped text anywhere, at any panel, in any of the four.

## The bar stopped being a bar

Two buttons and a mark do not need a band across the screen, and the band was costing the map
its full height. On a phone the header is now a pill floating at the head of the map, carrying
the mark and the way into the preferences; the legend pill stands beside it, and the wind rose
has the far corner. The filters went to the other end of the year rail, next to the arrows,
where the thumb already is.

Each drawer comes in from the side its own button is on, so they swapped: preferences from the
left, filters from the right. On a wide screen the header is a band again at the top of the
grid, the roster is the left column and the preferences still come from the right.

| Band | Top | Bottom |
| --- | --- | --- |
| Map | 0 | 578 |
| Year | 578 | 664 |

The map gained 45 pixels over the version with a bar at the foot, and 98 over the one with a bar
at the head.

## The layout turned upside down

On a phone the header moved below the year rail, to the lowest strip of the screen. Reaching the
top corner of a six-inch phone is a two-handed operation, and the atlas asked for it every time
a reader wanted the filters. Everything a thumb reaches for is now at the bottom: the map takes
the screen from the very top, the year sits under it, and the bar is the last band.

The two buttons swapped sides with it. How the world is drawn goes to the left, what is on it to
the right, and the name sits between them. The roster's title is "Filters" now, in all
seventeen languages — which is what that drawer actually is, once the year stopped living in
the settings and the list became the thing you narrow.

On a wide screen nothing moved: the header is back at the top of the grid, the buttons lose
their order, and the roster is still a column.

| Band | Top | Bottom |
| --- | --- | --- |
| Map | 0 | 533 |
| Year | 533 | 619 |
| Bar | 619 | 664 |

## A pass for duplication

Two panels describing the same civilization is two copies of every line, and a copy is a promise
to change both. The phone's had already drifted: it had lost the hand-drawn note and the
carried-border warning that the desktop's still showed. What each thing *says* now lives in one
place and the panels only arrange it.

| Extracted | Was written in | Now |
| --- | --- | --- |
| The realm's facts, the Wonder's, the expansion's | both panels | `civ-facts.tsx` |
| Who the contemporaries are, and how many is too many | both panels | `contemporaries.ts` |
| The neighbours, packed as arms or named in rows | two components | `rivals.tsx`, one prop apart |
| A civilization's arms | five `img` tags, five spellings | `civ-arms.tsx` and `assets.ts` |
| The lookup of a civilization's release | both panels | `expansions.ts` |

The refactor turned up a bug it had caused on the way: with the neighbours moved into a shared
component, tapping one in the deck traced the realm behind a panel the reader could not see
past, because only the sheet knew how to get out of the way. The deck now answers the same
question the sheet does — it closes the drawer.

Dead weight went with it: the styles for a settings sheet that has not carried the year for some
time, two credit lines with no user, and a stitched edge the legend stopped wearing.

Two things the earlier sweep had flagged are fixed. A share that rounds to nothing now prints as
"<1%" rather than "0%", which said the one thing it could not mean. And the roster's expansion
chips, the only controls in the atlas under any reasonable target, are a thumb on a phone and a
pointer's worth on a desktop, like every other control.

## What I would decide before going further

Whether the map should reframe when a panel opens and closes. It does not in the spike: the
realm is framed against the bar alone, so opening the Realm panel hides more than half of it.
Reframing on every tap would make the map jump; not reframing makes the widest panel useless
for looking at the ground it describes. The Contemporaries panel is the one that most needs the
map, and it is also the shortest, which suggests ordering the panels by how much map they owe
the reader rather than by how much content they have.
