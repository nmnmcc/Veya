import { Effect, Stream } from "effect";

import type { VideoClip } from "@veya/core";

import { SvgDecoder } from "./SvgDecoder";

export namespace Svg {
  export type Options<E = never, R = never> = {
    readonly fitTo?: Effect.Effect<SvgDecoder.FitTo, E, R>;
    readonly background?: Effect.Effect<string, E, R>;
  };

  export interface Svg<E = never, R = never> extends VideoClip.VideoClip<
    E | SvgDecoder.SvgDecoderError,
    R | SvgDecoder
  > {}

  export const make = <OE = never, OR = never>(
    source: SvgDecoder.MediaSource,
    options: Options<OE, OR> = {},
  ): Svg<OE, OR> => {
    return Stream.unwrap(
      Effect.gen(function* () {
        const { decode } = yield* SvgDecoder;
        const bitmap = yield* decode(source, yield* Effect.all(options, { concurrency: "unbounded" }));

        return Stream.make(bitmap);
      }),
    );
  };
}
