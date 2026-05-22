# Veya

Veya is a programmable video creation library for TypeScript. Its core is an
Effect-style declarative model for composing moving images as structured
sequences, independent tracks, gaps, and media clips.

```ts
import { Gap, Image, Sequence, Video, pipe } from "veya";

const program = pipe(
  Sequence.make({
    size: [1920, 1080],
    framerate: 30,
    tracks: [
      [
        Video.make("intro.mp4"),
        Gap.make("500 millis"),
        Image.make("cover.png"),
        Sequence.make({
          tracks: [[Image.make("nested.png")]],
        }),
      ],
    ],
  }),
  Sequence.withName("main"),
);
```

Tracks do not share an alignment grid. Each track owns its own timeline, and
explicit empty spans are represented by gaps inside that track:

```ts
const base = Sequence.make({
  tracks: [
    [Video.make("a.mp4"), Image.make("b.png")],
    [Gap.make("1 second"), Image.make("caption.png")],
  ],
});
```

Plain objects are intentionally not accepted as track items. Use `Gap.make()`
when empty time on a track is meaningful.

The source follows the Effect layout: public modules such as `Sequence.ts` and
`Video.ts` expose types, constructors, guards, and data-first/data-last
combinators, while concrete object construction lives under `src/internal`.
