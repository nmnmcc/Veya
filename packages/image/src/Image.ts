import { Effect, Stream } from "effect";

import { Effectable, type Size, type VideoClip } from "@veya/core";

import { ImageDecoder } from "./ImageDecoder";
import { ImageProber } from "./ImageProber";

export namespace Image {
  export type Options<E = never, R = never> = {
    readonly size?: Effectable<Size, E, R>;
  };

  export interface Image<E = never, R = never> extends VideoClip.VideoClip<
    E | ImageDecoder.ImageDecoderError | ImageProber.ImageProberError,
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
        const bitmap = yield* decode(
          source,
          yield* Effect.all(Effectable.map({ ...metadata, ...options }), { concurrency: "unbounded" }),
        );

        return Stream.make(bitmap);
      }),
    );
  };
}
