# 0004 — Interface state stays a reducer

*Accepted, 15 September 2026.*

## Context

The rule for this codebase is that the main logic is object-oriented. Applied without thinking, it
would take in `AtlasState` — the year on the rail, the open panel, the pinned realms, the chosen
projection — and turn it into a class with subscribers.

## Decision

It does not. Object orientation stops at the boundary of the domain and the services.

What the reader is currently looking at is *interface* state: it exists because there is a screen,
it dies with the tab, and its only consumer is the tree it lives in. It stays a `useReducer` with
a pure folding function.

Policy about the subject, on the other hand, leaves the reducer entirely. Which realms belong on
the map is a rule about realms, not about React, and it lives in `domain/rules/`.

## Consequences

The reducer is already a pure function and already tested without a tree, so the thing a class
would have bought — testability — was never missing. What a class would have added is a
subscription model to keep in step with React's own, and the batching that React does for free.

The state shape is a UI concern, so a service that needs a slice of it declares its own narrow
shape and lets the state satisfy it structurally: `AddressService` takes a `SharedState` of three
fields and knows nothing about the other eight. That keeps the arrow pointing one way — the
interface knows about the services, the services know nothing about the interface.
