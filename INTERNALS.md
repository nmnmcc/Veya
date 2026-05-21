# Internals

## Purpose

This document records implementation-level conventions for Veya. Keep
`DESIGN.md` focused on user-facing concepts and use this file for runtime
representation, module layout, validation, and reference patterns.

The main implementation reference is `.ref/effect-smol/`. Use it for style and
organization only; do not import from it.

## Reference Patterns

The current layout borrows these Effect patterns:

- Public module plus internal implementation, as in
  `.ref/effect-smol/packages/effect/src/Option.ts` and
  `.ref/effect-smol/packages/effect/src/internal/option.ts`.
- Data-first/data-last combinators through `dual`, as in
  `.ref/effect-smol/packages/effect/src/Function.ts`.
- `.pipe(...)` support through shared pipeable behavior, as in
  `.ref/effect-smol/packages/effect/src/Pipeable.ts`.
- Runtime tags such as `TypeId` for guards and type-directed construction.

## Module Split

Public modules live directly under `src/`:

- `Sequence.ts`, `Track.ts`, `Clip.ts`, `Slot.ts`, `Video.ts`, `Image.ts`,
  `Anchor.ts`, and `Timing.ts` define exported types, constructors, guards, and
  combinators.
- `index.ts` is the package facade and exports module namespaces.

Internal modules live under `src/internal/`:

- `sequence.ts`, `track.ts`, `clip.ts`, `anchor.ts`, and `timing.ts` construct and
  normalize runtime values.
- `common.ts` contains shared helpers such as pipeable behavior, object copying,
  and property checks.
- `typeIds.ts` centralizes runtime tag strings.

Public modules should not expose internal helpers. Internal modules may depend on
public types with `import type`.

## Runtime Values

Runtime timeline values are immutable from the user's perspective. Constructors
create tagged objects with prototypes that provide `.pipe(...)`, `toJSON()`, and
`toString()` behavior.

Each model has a runtime tag:

- `SequenceTypeId`
- `TrackTypeId`
- `ClipTypeId`
- `AnchorTypeId`

Guards such as `isSequence`, `isTrack`, and `isClip` should check these tags
rather than relying on structural shape alone.

## Construction And Validation

Construction should be conservative:

- Normalize only explicit convenience inputs, such as `Duration.Input` for
  timing.
- Preserve explicit timeline semantics. In particular, a track item must already
  be a `Clip` or `Sequence`.
- Reject plain objects as track items. Empty timing must be represented with
  `Slot.make()`.
- Throw early when runtime input is invalid. A future validation layer may return
  typed Effect errors, but constructors currently fail fast.

`Track.make` is the main boundary for enforcing valid track elements. `Slot.make`
is the boundary for empty timing blocks.

## Immutability

Combinators should return copied values rather than mutating the original. Use
the shared `copyWith` helper for shallow updates that preserve prototypes.

Examples:

```ts
Sequence.withName(sequence, "intro");
Video.withFit(video, "cover");
Slot.withDuration(slot, "1 second");
```

When adding combinators, prefer Effect-style overloads that support both direct
and piped usage when the operation naturally composes.

## Serialization

`toJSON()` should produce debugging-friendly structural data, not renderer-ready
instructions. Keep serialized output stable enough for smoke tests, but do not
treat it as a final interchange format until that is designed explicitly.

Media sources should serialize descriptively: strings and URLs as readable
locations, binary data by size, and streams by kind.

## Updating This Document

Update this file when changing internal module organization, runtime tags,
constructor behavior, validation strategy, serialization shape, or Effect-style
implementation conventions.
