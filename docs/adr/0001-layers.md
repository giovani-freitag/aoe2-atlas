# 0001 — Domain and services in plain classes, React behind hooks

*Accepted, 15 September 2026.*

## Context

The atlas answers three kinds of question and they had begun to answer each other's. What a
realm *is* — its span, its reach, which of them belong on the map — lived partly in
`domain/`, partly in a React context file, and partly inline in the shell's markup. Seven
components reached into the service container directly, so a component had to know that naming a
civilization needs a subscription to the language while painting one does not. The shell derived
the roster, the standing set and the draw list between its own hooks and its JSX, which put the
question "what is on the map" inside a file about layout.

None of that was broken. It was the arrangement in which the roster, the map and the panels could
quietly start disagreeing about which civilizations are being talked about.

## Decision

Three layers, and one seam between them.

**`domain/`** holds entities, values and rules as plain TypeScript with no framework in sight.
Policy that is about the subject rather than the screen goes in `domain/rules/` as a pure
function — which realms are drawn, which contemporaries a panel lists.

**`services/`** holds the classes that fetch, cache, translate, project and paint. Each takes a
single typed config object and is built once in the composition root.

**`react/`** holds the interface, and reaches the layers below **only through hooks**, in three
tiers: `hooks/services/` wraps one service each, `hooks/view/` composes state and services into
what a screen needs, `hooks/dom/` is browser plumbing. `useServices()` is imported by
`hooks/services/` and by nothing else.

## Consequences

A component asks for what it needs by name and gets the subscription that comes with it:
`useText()` holds the translation subscription, so the invariant every caller used to remember is
now held in one place. The shell became layout: everything it used to derive is in
`useAtlasView()`, the one place those three views of the roster are reconciled.

Rules moved out of React can be tested without a tree, and are — `drawnRealms` has its own suite
under `tests/unit/domain/`.

The cost is indirection: three files to read where there was one, and a hook per service whose
body is a single line. That is the price of the seam, and it is only worth paying because the
seam is what stops the layers leaking into each other again.
