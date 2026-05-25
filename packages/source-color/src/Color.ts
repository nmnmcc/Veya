import { Effect, Stream, pipe } from "effect";
import { CompositeVideoContext, Effectable } from "@veya/core";
import type { Bitmap, FrameCount, RGBA, Size, VideoClip } from "@veya/core";

export namespace Color {
  export interface Options<E = never, R = never> {
    readonly size?: Effectable<Size, E, R>;
  }

  export interface Color<E = never, R = never> extends VideoClip.VideoClip<E, R | CompositeVideoContext> {
    readonly color: Effectable<RGBA, E, R>;
    readonly duration: Effectable<FrameCount, E, R>;
    readonly size?: Effectable<Size, E, R>;
  }

  export const make = Effect.fn("Color.make")(function* <E = never, R = never>(
    color: Effectable<RGBA, E, R>,
    duration: Effectable<FrameCount, E, R>,
    options: Effectable<Options<E, R>, E, R> = {},
  ): Effect.fn.Return<Color<E, R>, E, R> {
    const [resolvedColor, resolvedDuration, resolvedOptions] = yield* Effectable.all([
      color,
      duration,
      options,
    ] as const);

    return {
      color: resolvedColor,
      duration: resolvedDuration,
      size: resolvedOptions.size,
      render: Stream.unwrap(
        Effect.gen(function* () {
          const size = yield* resolveSize(resolvedOptions);
          const frame = makeBitmap(size, resolvedColor);

          return pipe(
            Stream.range(0, resolvedDuration - 1),
            Stream.map(() => frame),
          );
        }),
      ),
    };
  });

  const resolveSize = <E, R>(options: Options<E, R>): Effect.Effect<Size, E, R | CompositeVideoContext> => {
    const size = options.size ?? CompositeVideoContext.use(({ size }) => Effect.succeed(size));

    return Effect.map(Effectable.all({ size }), ({ size }) => size);
  };

  const makeBitmap = ([width, height]: Size, color: RGBA): Bitmap => {
    return globalThis.Array.from({ length: height }, () =>
      globalThis.Array.from({ length: width }, () => [...color] as const),
    );
  };
}
