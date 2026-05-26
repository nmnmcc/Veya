import { Effect, Stream } from "effect";
import type { VideoClip } from "@veya/core";
import { SvgSource } from "./SvgSource";

export namespace Svg {
  export type Options<E = never, R = never> = {
    readonly fitTo?: Effect.Effect<SvgSource.FitTo, E, R>;
    readonly background?: Effect.Effect<string, E, R>;
  };

  export interface Svg<E = never, R = never> extends VideoClip.VideoClip<E | SvgSource.SvgSourceError, R | SvgSource> {}

  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: SvgSource.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Svg<SE | OE, SR | OR> => {
    return Stream.unwrap(
      Effect.gen(function* () {
        const { decode } = yield* SvgSource;
        const bitmap = yield* decode(source, yield* Effect.all(options, { concurrency: "unbounded" }));

        return Stream.make(bitmap);
      }),
    );
  };
}
