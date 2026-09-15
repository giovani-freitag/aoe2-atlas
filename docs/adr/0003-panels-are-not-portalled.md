# 0003 — The panels are not portalled

*Accepted, 15 September 2026.*

## Context

A dialog primitive portals its content to the end of the body by default, which is the right
answer almost everywhere: it frees the panel from every ancestor's overflow and stacking context.
Two panels here need the opposite.

The roster **is a column of the shell's grid** on a wide screen — `grid-area: roster` — and an
element moved to the end of the body cannot be one.

The civilization sheet must slide **behind the year rail**, not across it. The rail is the axis
every reading on the map is qualified by, and a panel that sweeps over it on its way up is asking
the reader to lose the one number the whole atlas is read against.

## Decision

`Dialog.Content` renders in place, with no `Portal`. Both panels already sit as direct children of
the shell, so the grid keeps its column and the stacking order keeps the rail on top.

The same goes for the select's dropped list and the hover card: neither is portalled. Both are
positioned with the `fixed` strategy, so no ancestor's `overflow` clips them — which was verified
rather than assumed, by walking the ancestors of a live card and checking which of them are
containing blocks for a fixed element. None are.

## Consequences

The panels keep their place in a layout that was built around them, and modality became a prop
rather than a mode the panel has to be closed and reopened to change — which is the whole class of
bug the previous branch had just finished fixing by hand.

The obligation this creates: anything that gives an ancestor of a panel a `transform`, `filter`,
`perspective`, `contain` or `will-change` turns it into a containing block for fixed elements, and
the floating pieces will start being clipped by it. The map's own marks layer already carries a
`transform` for raster reasons; the cards escape it only because they are not inside it.
