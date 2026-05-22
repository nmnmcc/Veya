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

## Package Split

The core orchestration package lives under `packages/core/`. Concrete media
packages live beside it, for example `packages/video/` and `packages/image/`.

Public modules live directly under `packages/core/src/`:

- `Sequence.ts`, `Track.ts`, `Clip.ts`, `Gap.ts`, `Anchor.ts`, and `Timing.ts`
  define exported types, constructors, guards, and combinators.
- `index.ts` is the `@veya/core` package facade and exports module namespaces.

Internal modules live under `packages/core/src/internal/`:

- `sequence.ts`, `track.ts`, `clip.ts`, `anchor.ts`, and `timing.ts` construct and
  normalize runtime values.
- `common.ts` contains shared helpers such as pipeable behavior, object copying,
  and property checks.
- `typeIds.ts` centralizes runtime tag strings.

Public modules should not expose internal helpers. Internal modules may depend on
public types with `import type`.

Concrete media packages follow the same shape:

- `packages/video/src/Video.ts` and `packages/image/src/Image.ts` expose their
  public media models, constructors, guards, and media-specific combinators.
- Their `src/internal/` modules adapt package-specific fields to
  `Clip.makeMedia`.

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
rather than relying on structural shape alone. Concrete media guards should use
`Clip.hasTag` to refine a core media value by its `_tag`.

## Construction And Validation

Construction should be conservative:

- Normalize only explicit convenience inputs, such as `Duration.Input` for
  timing.
- Preserve independent track semantics. In particular, a track item must already
  be a `Clip` or `Sequence`, and timing gaps belong to the track that contains
  them.
- Reject plain objects as track items. Empty timing must be represented with
  `Gap.make()`.
- Build concrete media with `Clip.makeMedia` so custom media receives the core
  clip runtime tag, pipeable behavior, timing normalization, and shared base
  serialization.
- Throw early when runtime input is invalid. A future validation layer may return
  typed Effect errors, but constructors currently fail fast.

`Track.make` is the main boundary for enforcing valid track elements. `Gap.make`
is the boundary for empty timing spans. `Clip.makeMedia` is the boundary for
custom media values.

## Immutability

Combinators should return copied values rather than mutating the original. Use
the shared `copyWith` helper for shallow updates that preserve prototypes.

Examples:

```ts
Sequence.withName(sequence, "intro");
Video.withFit(video, "cover");
Gap.withDuration(gap, "1 second");
```

When adding combinators, prefer Effect-style overloads that support both direct
and piped usage when the operation naturally composes. Media packages can build
field-specific combinators on top of `Clip.withProperties`.

## Serialization

`toJSON()` should produce debugging-friendly structural data, not renderer-ready
instructions. Keep serialized output stable enough for smoke tests, but do not
treat it as a final interchange format until that is designed explicitly.

Media sources should serialize descriptively with `Clip.sourceToJSON`: strings
and URLs as readable locations, binary data by size, and streams by kind.
Concrete media packages own any additional serialized fields.

## Updating This Document

Update this file when changing internal module organization, runtime tags,
constructor behavior, validation strategy, serialization shape, or Effect-style
implementation conventions.
