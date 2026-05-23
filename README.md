# Veya

Veya is a programmable video creation library for TypeScript. Its core is an
Effect-style declarative model for composing moving images as structured
sequences, independent tracks, gaps, and media clips.

```ts
import { Gap, Sequence, pipe } from "@veya/core";
import { Image } from "@veya/image";
import { Video } from "@veya/video";

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

The core package focuses on timeline orchestration: sequences, tracks, gaps,
anchors, timing, and the `Clip.makeMedia` extension point for custom media.
Concrete media implementations live in separate workspace packages such as
`@veya/video` and `@veya/image`.

Track items are explicit domain values: clips or nested sequences. Each item
carries its corresponding rasterizer service tag, and the core pipeline exposes
demuxer, decoder, compositor, encoder, and muxer service tags that can be
provided with Effect layers:

```ts
import { Effect, Layer } from "effect";
import { Clip, Pipeline } from "@veya/core";
import { Image } from "@veya/image";

const ImageRasterizer = Layer.succeed(Image.Rasterizer, {
  rasterize: (image) =>
    Effect.succeed({
      source: Clip.sourceToJSON(image.source),
    }),
});

const program = Image.rasterize(Image.make("cover.png")).pipe(Effect.provide(ImageRasterizer));

const serviceTag = Image.make("cover.png").rasterizer;

const PipelineLive = Layer.mergeAll(
  Layer.succeed(Pipeline.Demuxer, { demux: Effect.succeed }),
  Layer.succeed(Pipeline.Decoder, { decode: Effect.succeed }),
  Layer.succeed(Pipeline.Compositor, { composite: Effect.succeed }),
  Layer.succeed(Pipeline.Encoder, { encode: Effect.succeed }),
  Layer.succeed(Pipeline.Muxer, { mux: Effect.succeed }),
);
```
