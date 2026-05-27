import { Effect, Stream } from "effect";

import { Effectable, type Size, type VideoClip } from "@veya/core";

import { SvgDecoder } from "./SvgDecoder";
import { SvgProber } from "./SvgProber";

export namespace Svg {
  export type Options<E = never, R = never> = {
    readonly size?: Effectable<Size, E, R> | undefined;
    readonly fitTo?: Effectable<SvgDecoder.FitTo, E, R> | undefined;
    readonly background?: Effectable<string, E, R> | undefined;
  };

  export interface Svg<E = never, R = never> extends VideoClip.VideoClip<
    E | SvgDecoder.SvgDecoderError | SvgProber.SvgProberError,
    R | SvgDecoder | SvgProber
  > {}

  export const make = <OE = never, OR = never>(
    source: SvgDecoder.MediaSource,
    options: Options<OE, OR> = {},
  ): Svg<OE, OR> => {
    return Stream.unwrap(
      Effect.gen(function* () {
        const { decode } = yield* SvgDecoder;
        const { probe } = yield* SvgProber;
        const metadata = yield* probe(source);
        const decodeOptions = yield* Effect.all(
          Effectable.mapOptions<SvgDecoder.DecodeOptions, OE, OR>(
            {
              size: metadata.size,
              fitTo: undefined,
              background: undefined,
            },
            options,
          ),
          { concurrency: "unbounded" },
        );
        const bitmap = yield* decode(source, decodeOptions);

        return Stream.make(bitmap);
      }),
    );
  };
}
