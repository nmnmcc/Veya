# Design

## Vision

Veya is a programmable video creation library for TypeScript. Its goal is to
make video creation feel closer to describing a program: authors declare
sequences, layers, timing blocks, media, and eventually rendering intent as
composable data.

The current core focuses on a declarative timeline model for composing moving
images as structured data. Rendering remains a later concern, but the design
should leave room for future modules that cover effects, layout, asset loading,
validation, preview, and export.

The library should stay small, composable, and predictable. Its API is inspired
by Effect's module-oriented style in `.ref/effect-smol/`: clear concepts, named
constructors, immutable transformation helpers, and documentation that starts
from the mental model.

Implementation-level details live in `INTERNALS.md`.

## Mental Model

A video is a tree of timeline containers:

- `Sequence` is a reusable timeline. It can be the whole video or a nested fragment.
- `Track` is a layer inside a sequence.
- `Slot` is an explicit empty time block.
- `Video` and `Image` are media blocks.
- `Anchor` and `Timing` describe where a block lives in time.

At the top level, users should be able to read a sequence as a layered score:

```ts
Sequence.make({
  tracks: [
    [Slot.make("2 seconds"), Slot.make("3 seconds")],
    [Video.make("intro.mp4"), Image.make("cover.png")],
  ],
});
```

## Explicit Timing Blocks

Empty timeline positions are meaningful, so they must be explicit. The API uses
`Slot.make()` instead of accepting `{}` because a plain object does not say
whether the author meant "empty time", "unfinished content", or "invalid input".

This keeps the timeline readable:

```ts
[Slot.make(), Slot.make("1 second"), Video.make("clip.mp4")];
```

Slots are not media. They are rhythm, spacing, and alignment tools.

## Composition

Sequences should compose naturally. A nested `Sequence` can appear inside a track,
which allows larger videos to be assembled from smaller reusable sections:
intros, lower thirds, transitions, title cards, or repeated visual motifs.

The central design shape should remain:

```txt
Sequence -> Track -> Slot | Video | Image | Sequence
```

New features should extend this model rather than bypass it.

## API Principles

- Prefer declarative data over immediate rendering side effects.
- Prefer explicit concepts over clever shorthand.
- Keep values immutable from the user's perspective.
- Expose small named constructors such as `Sequence.make`, `Slot.make`, and
  `Video.make`.
- Expose transformation helpers such as `withDuration`, `withName`, and
  `withFit` when they make sequence descriptions easier to compose.
- Let TypeScript guide authors toward valid timelines.

## Renderer Boundary

Veya currently describes video structure; it does not define a rendering engine.
Renderer-specific choices such as codecs, export targets, frame generation,
asset loading, and compositing details should live behind future renderer
modules that extend the programmable creation model.

The sequence model should remain renderer-neutral for as long as possible.

## Open Questions

Future design work should clarify:

- whether track order is bottom-to-top or top-to-bottom;
- how media duration interacts with slot duration;
- how transitions, masks, layout, and effects are represented;
- how validation should be reported to users;
- where renderer-specific APIs begin.

When these design decisions change, update this document in the same change.
