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

## What I would decide before going further

Whether the map should reframe when a panel opens and closes. It does not in the spike: the
realm is framed against the bar alone, so opening the Realm panel hides more than half of it.
Reframing on every tap would make the map jump; not reframing makes the widest panel useless
for looking at the ground it describes. The Contemporaries panel is the one that most needs the
map, and it is also the shortest, which suggests ordering the panels by how much map they owe
the reader rather than by how much content they have.
