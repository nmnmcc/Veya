import { Effect, Stream } from "effect";

import { Effectable, type Size, type VideoClip } from "@veya/core";

import { ImageDecoder } from "./ImageDecoder";
import { ImageProber } from "./ImageProber";

export namespace Image {
  export type Options<E = never, R = never> = {
    readonly size?: Effectable<Size, E, R> | undefined;
  };

  export interface Image<E = never, R = never> extends VideoClip.VideoClip<
    E | ImageDecoder.Error | ImageProber.Error,
    R | ImageDecoder | ImageProber
  > {}

  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: ImageDecoder.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Image<SE | OE, SR | OR> => {
    return Stream.unwrap(
      Effect.gen(function* () {
        const { decode } = yield* ImageDecoder;
        const { probe } = yield* ImageProber;
        const metadata = yield* probe(source);
        const decodeOptions = yield* Effect.all(Effectable.options({ size: metadata.size }, options), {
          concurrency: "unbounded",
        });
        const bitmap = yield* decode(source, decodeOptions);

        return Stream.make(bitmap);
      }),
    );
  };
}
