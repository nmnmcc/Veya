import { Effect, Stream } from "effect";

import type { Size, VideoClip } from "@veya/core";

import { ImageDecoder } from "./ImageDecoder";

export namespace Image {
  export type Options<E = never, R = never> = {
    readonly size?: Effect.Effect<Size, E, R>;
  };

  export interface Image<E = never, R = never> extends VideoClip.VideoClip<
    E | ImageDecoder.ImageDecoderError,
    R | ImageDecoder
  > {}

  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: ImageDecoder.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Image<SE | OE, SR | OR> => {
    return Stream.unwrap(
      Effect.gen(function* () {
        const { decode } = yield* ImageDecoder;
        const bitmap = yield* decode(source, yield* Effect.all(options, { concurrency: "unbounded" }));

        return Stream.make(bitmap);
      }),
    );
  };
}
