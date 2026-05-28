import { Effect, Stream } from "effect";

import { Effectable, type Size, type VideoClip, type VideoTick } from "@veya/core";

import { ImageDecoder } from "./ImageDecoder";
import { ImageProber } from "./ImageProber";

export namespace Image {
  /** Options for creating a still-image clip. */
  export type Options<E = never, R = never> = {
    /** Output frame size in pixels. Defaults to the probed image size. */
    readonly size?: Effectable<Size, E, R> | undefined;
  };

  /** A one-frame video clip decoded from an image source. */
  export interface Image<E = never, R = never> extends VideoClip.VideoClip<
    VideoTick,
    never,
    never,
    E | ImageDecoder.Error | ImageProber.Error,
    R | ImageDecoder | ImageProber
  > {}

  /** Creates a one-frame video clip from image bytes or a byte stream. */
  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: ImageDecoder.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Image<SE | OE, SR | OR> => {
    return (stream) =>
      Stream.unwrap(
        Effect.gen(function* () {
          const { decode } = yield* ImageDecoder;
          const { probe } = yield* ImageProber;
          const metadata = yield* probe(source);
          const decodeOptions = yield* Effect.all(Effectable.options({ size: metadata.size }, options), {
            concurrency: "unbounded",
          });
          const bitmap = yield* decode(source, decodeOptions);

          return stream.pipe(
            Stream.take(1),
            Stream.map(() => bitmap),
          );
        }),
      );
  };
}
