import { Effect, Stream } from "effect";
import { Effectable } from "@veya/core";
import type { VideoClip } from "@veya/core";
import { SvgSource } from "./SvgSource";

export namespace Svg {
  export type MediaSource<E = never, R = never> = SvgSource.MediaSource<E, R>;

  export type Service = InstanceType<typeof SvgSource>;

  export type FitTo = SvgSource.FitTo;

  export const SvgSourceError = SvgSource.SvgSourceError;
  export type SvgSourceError = SvgSource.SvgSourceError;

  export type DecodeOptions = SvgSource.DecodeOptions;

  export interface Options<E = never, R = never> {
    readonly fitTo?: Effectable<FitTo, E, R>;
    readonly background?: Effectable<string, E, R>;
  }

  export interface Svg<SourceE = never, SourceR = never, E = never, R = never> extends VideoClip.VideoClip<
    SourceE | E | SvgSourceError,
    SourceR | R | Service
  > {
    readonly source: Effectable<MediaSource<SourceE, SourceR>, E, R>;
    readonly fitTo?: Effectable<FitTo, E, R>;
    readonly background?: Effectable<string, E, R>;
  }

  export const make = Effect.fn("Svg.make")(function* <SourceE = never, SourceR = never, E = never, R = never>(
    source: Effectable<MediaSource<SourceE, SourceR>, E, R>,
    options: Effectable<Options<E, R>, E, R> = {},
  ): Effect.fn.Return<Svg<SourceE, SourceR, E, R>, E, R> {
    const resolvedSource = yield* Effectable.resolve(source);
    const resolvedOptions = yield* Effectable.resolve(options);

    return {
      source: resolvedSource,
      fitTo: resolvedOptions.fitTo,
      background: resolvedOptions.background,
      render: Stream.unwrap(
        Effect.gen(function* () {
          const { decode } = yield* SvgSource;
          const decodeOptions = yield* resolveDecodeOptions(resolvedOptions);
          const bitmap = yield* decode(resolvedSource, decodeOptions);

          return Stream.make(bitmap);
        }),
      ),
    };
  });

  const resolveDecodeOptions = <E, R>(options: Options<E, R>): Effect.Effect<DecodeOptions, E, R> => {
    return Effect.gen(function* () {
      const fitTo = options.fitTo === undefined ? undefined : yield* Effectable.resolve(options.fitTo);
      const background = options.background === undefined ? undefined : yield* Effectable.resolve(options.background);

      return { fitTo, background };
    });
  };
}
