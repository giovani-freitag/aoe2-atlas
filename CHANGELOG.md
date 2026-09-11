# Changelog

## [1.1.0](https://github.com/giovani-freitag/aoe2-atlas/compare/aoe2-atlas-v1.0.0...aoe2-atlas-v1.1.0) (2026-09-11)


### Added

* add an equal-area atlas of Age of Empires II wonders and territories ([ad0b1a0](https://github.com/giovani-freitag/aoe2-atlas/commit/ad0b1a0d1c0162b42024e46e5b3d8aece0a454d9))
* anchor each shield inside its realm, share one bottom sheet, engrave the iron ([21fa6db](https://github.com/giovani-freitag/aoe2-atlas/commit/21fa6db4f05e7b6567159da8efc1b9532ec5e015))
* let the reader pick the projection and hear how much it distorts ([2b925df](https://github.com/giovani-freitag/aoe2-atlas/commit/2b925df2d88e32a8f5b894125a52d5bec2072b60))
* let the sheet move the year rail to a realm's height ([5571b55](https://github.com/giovani-freitag/aoe2-atlas/commit/5571b55b809851a7792132ab36538768837469ef))
* preview the focused realm, move the layers switch to the map controls, trim the bar ([2dde93a](https://github.com/giovani-freitag/aoe2-atlas/commit/2dde93ad66fffde7dc4f3f225c7dcb4958212e5a))
* rebuild the interface mobile-first with an Age skin and offcanvas panels ([80e5ad3](https://github.com/giovani-freitag/aoe2-atlas/commit/80e5ad32a507a8c58238290b2fd60bd5c1503da2))
* speak the seventeen languages Age of Empires II is sold in ([02b2b38](https://github.com/giovani-freitag/aoe2-atlas/commit/02b2b38d09e6ae1369380666ea546d55e7f2b89e))


### Fixed

* bridge source gaps by default and declare the one historical absence ([806e64b](https://github.com/giovani-freitag/aoe2-atlas/commit/806e64b1e250e814060d04b0bb1544bc963b5d2b))
* drop the roster handle where the roster is already a column ([b25f23d](https://github.com/giovani-freitag/aoe2-atlas/commit/b25f23d1043bdca56179088b1baf975fead2e32d))
* make the settings control a toggle and the grip tell the truth ([f5db59a](https://github.com/giovani-freitag/aoe2-atlas/commit/f5db59a5e718634145995d4de15dd87ebd8cb67f))
* start the Mongols at Temujin's election so their rise is on the map ([f454105](https://github.com/giovani-freitag/aoe2-atlas/commit/f4541058a5da44a3705d84453ed94814ccfe5db5))
* stop drawing a realm across a century the source deliberately omits ([b925e78](https://github.com/giovani-freitag/aoe2-atlas/commit/b925e78067f4192048e76ecf003de7562b20af69))


### Changed

* cut one border per century instead of a single peak extent ([90cd821](https://github.com/giovani-freitag/aoe2-atlas/commit/90cd82111f823373b48a1bd0e476f946ae2b2f17))

## 1.0.0 (2026-09-10)

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

[Full history](https://github.com/giovani-freitag/aoe2-atlas/commits/v1.0.0)
