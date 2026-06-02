import { Effect, Stream } from "effect";

import { Effectable, type Size, VideoClip, VideoContext } from "@veya/core";

import { ImageDecoder } from "./ImageDecoder";
import { ImageProber } from "./ImageProber";

export namespace Image {
  export interface Image<I, E = never, R = never> extends VideoClip.VideoClip<
    I,
    never,
    never,
    E | ImageDecoder.Error | ImageProber.Error,
    R | ImageDecoder | ImageProber
  > {}

  export type Options<E = never, R = never> = {
    /** Output frame size in pixels. Defaults to the probed image size. */
    readonly size?: Effectable<Size, E, R> | undefined;
  };

  export const make = <I, SE = never, SR = never, OE = never, OR = never>(
    source: ImageDecoder.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Effect.Effect<Image<I, SE | OE, SR | OR>, never, VideoContext> => {
    return VideoClip.make((stream) =>
      Stream.unwrap(
        Effect.gen(function* () {
          const { decode } = yield* ImageDecoder;
          const { probe } = yield* ImageProber;
          const metadata = yield* probe(source);
          const decodeOptions = yield* Effect.all(Effectable.options({ size: metadata.size }, options), {
            concurrency: "unbounded",
          });
          const frame = yield* decode(source, decodeOptions);

          return stream.pipe(
            Stream.take(1),
            Stream.map(() => frame),
          );
        }),
      ),
    );
  };
}
