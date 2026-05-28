import { Effect, Stream } from "effect";

import { Effectable, type Size, type VideoClip, type VideoTick } from "@veya/core";

import { SvgDecoder } from "./SvgDecoder";
import { SvgProber } from "./SvgProber";

export namespace Svg {
  /** Options for creating a still-image clip from SVG markup. */
  export type Options<E = never, R = never> = {
    /** Output frame size in pixels. Defaults to the probed SVG size. */
    readonly size?: Effectable<Size, E, R> | undefined;
    /** Resvg fit mode used while rendering the SVG. */
    readonly fitTo?: Effectable<SvgDecoder.FitTo, E, R> | undefined;
    /** Background color applied behind the rendered SVG. */
    readonly background?: Effectable<string, E, R> | undefined;
  };

  /** A one-frame video clip rendered from SVG markup. */
  export interface Svg<E = never, R = never> extends VideoClip.VideoClip<
    VideoTick,
    never,
    never,
    E | SvgDecoder.Error | SvgProber.Error,
    R | SvgDecoder | SvgProber
  > {}

  /** Creates a one-frame video clip from SVG markup. */
  export const make = <OE = never, OR = never>(
    source: SvgDecoder.MediaSource,
    options: Options<OE, OR> = {},
  ): Svg<OE, OR> => {
    return (stream) =>
      Stream.unwrap(
        Effect.gen(function* () {
          const { decode } = yield* SvgDecoder;
          const { probe } = yield* SvgProber;
          const metadata = yield* probe(source);
          const decodeOptions = yield* Effect.all(
            Effectable.options(
              {
                size: metadata.size,
              },
              options,
            ),
            { concurrency: "unbounded" },
          );
          const bitmap = yield* decode(source, decodeOptions);

          return stream.pipe(
            Stream.take(1),
            Stream.map(() => bitmap),
          );
        }),
      );
  };
}
