# Changelog

## 1.1.0 (2026-09-11)

The first public release: the whole atlas, in every language the game is sold in.

### Added

- An equal-area world map with all 56 civilizations of *Age of Empires II*, each Wonder standing
  on the real monument it was modelled on.
- **A border per century, not one per civilization.** Nineteen slices from 200 to 1600, cut from
  [historical-basemaps](https://github.com/aourednik/historical-basemaps), fetched one at a time.
  Two realms overlapping on screen now means they actually met.
- **Uncertainty drawn as uncertainty**: solid where the source surveyed the border, dashed and
  blurred where it is approximate, faint where the line had to be borrowed from another century —
  with the panel saying which century and how far away.
- **Seventeen languages**: en, pt-BR, es, es-MX, fr, de, it, pl, ru, tr, hi, ja, ko, ms, vi,
  zh-CN, zh-TW. Names, monuments, places, realms, numbers, dates, search and collation all follow.
- A projection picker — Equal Earth, Natural Earth, Mercator — that changes the drawing and never
  a number, because every area is measured on the sphere when the data is built.
- The Age skin: parchment, tooled leather, engraved iron, oak, rope, embers and Cinzel.
- Mobile-first layout written for 360px with no media query at all; the map owns the screen and
  everything else arrives as an offcanvas panel over it.
- Build-time assertions that refuse a Wonder standing outside its own realm without a written
  reason, a civilization with no century, a ring wound inside out, or a locale bundle missing a key.

[Every commit behind this release](https://github.com/giovani-freitag/aoe2-atlas/commits/v1.1.0)
