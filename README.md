# Veya

Veya is a programmable video creation library for TypeScript. Its core is an
Effect-style declarative model for composing moving images as structured
sequences, tracks, slots, and clips.

```ts
import { Image, Sequence, Slot, Video, pipe } from "veya";

const program = pipe(
  Sequence.make({
    size: [1920, 1080],
    framerate: 30,
    tracks: [
      [Slot.make("2 seconds"), Slot.make("3 seconds"), Slot.make("1 second")],
      [
        Video.make("intro.mp4"),
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

The first track can still be used as a timing base, but empty blocks are explicit
slots:

```ts
const base = Sequence.make({
  tracks: [
    [Slot.make(), Slot.make(), Slot.make()],
    [Video.make("a.mp4"), Image.make("b.png"), Slot.make("1 second")],
  ],
});
```

Plain objects are intentionally not accepted as track items. Use `Slot.make()`
when a timeline position is empty but meaningful.

The source follows the Effect layout: public modules such as `Sequence.ts` and
`Video.ts` expose types, constructors, guards, and data-first/data-last
combinators, while concrete object construction lives under `src/internal`.
