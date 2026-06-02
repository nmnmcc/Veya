import { Effect, Stream } from "effect";

import { Effectable, type Size, VideoClip, VideoContext } from "@veya/core";

import { SvgDecoder } from "./SvgDecoder";
import { SvgProber } from "./SvgProber";

export namespace Svg {
  export interface Svg<I, E = never, R = never> extends VideoClip.VideoClip<
    I,
    never,
    never,
    E | SvgDecoder.Error | SvgProber.Error,
    R | SvgDecoder | SvgProber
  > {}

  export type Options<E = never, R = never> = {
    /** Output frame size in pixels. Defaults to the probed SVG size. */
    readonly size?: Effectable<Size, E, R> | undefined;
    /** Resvg fit mode used while rendering the SVG. */
    readonly fitTo?: Effectable<SvgDecoder.FitTo, E, R> | undefined;
    /** Background color applied behind the rendered SVG. */
    readonly background?: Effectable<string, E, R> | undefined;
  };

  export const make = <I, OE = never, OR = never>(
    source: SvgDecoder.MediaSource,
    options: Options<OE, OR> = {},
  ): Effect.Effect<Svg<I, OE, OR>, never, VideoContext> => {
    return VideoClip.make((stream) =>
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
