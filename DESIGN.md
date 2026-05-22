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
- `Track` is an independent layer inside a sequence.
- `Gap` is an explicit empty span inside one track.
- `Video` and `Image` are media blocks.
- `Anchor` and `Timing` describe where a block lives in time.

At the top level, users should be able to read a sequence as independent
layered timelines:

```ts
Sequence.make({
  tracks: [
    [Video.make("intro.mp4"), Gap.make("500 millis"), Image.make("cover.png")],
    [Gap.make("1 second"), Image.make("caption.png")],
  ],
});
```

## Independent Tracks

Tracks do not share an alignment grid and do not need corresponding items in
other tracks. Each track is evaluated as its own ordered timeline. When a track
needs silence or empty visual time before, between, or after content, that
absence is represented directly in the same track with `Gap.make()`.

Empty timeline spans are meaningful, so they must be explicit. The API uses
`Gap.make()` instead of accepting `{}` because a plain object does not say
whether the author meant "empty time", "unfinished content", or "invalid input".

This keeps each track readable without implying cross-track alignment:

```ts
[Gap.make("1 second"), Video.make("clip.mp4")];
```

Gaps are not media. They are spacing tools for a single track.

## Composition

Sequences should compose naturally. A nested `Sequence` can appear inside a track,
which allows larger videos to be assembled from smaller reusable sections:
intros, lower thirds, transitions, title cards, or repeated visual motifs.

The central design shape should remain:

```txt
Sequence -> Track -> Gap | Video | Image | Sequence
```

New features should extend this model rather than bypass it.

## API Principles

- Prefer declarative data over immediate rendering side effects.
- Prefer explicit concepts over clever shorthand.
- Keep values immutable from the user's perspective.
- Expose small named constructors such as `Sequence.make`, `Gap.make`, and
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
- how media duration interacts with gap duration;
- how transitions, masks, layout, and effects are represented;
- how validation should be reported to users;
- where renderer-specific APIs begin.

When these design decisions change, update this document in the same change.
