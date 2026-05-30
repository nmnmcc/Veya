import { Effect, pipe, Stream } from "effect";

import { VideoContext } from "@veya/core";
import { Effectable, type Size, type VideoClip } from "@veya/core";

export namespace Color {
  export interface Color<I, E = never, R = never> extends VideoClip.VideoClip<I, never, never, E, R | VideoContext> {}

  export type Options<E = never, R = never> = {
    /** Frame size in pixels. Defaults to the active `VideoContext` size. */
    readonly size?: Effectable<Size, E, R> | undefined;
  };

  export const make =
    <I, OE = never, OR = never>(
      color: VideoClip.RGBA,
      duration: number,
      options: Options<OE, OR> = {},
    ): Color<I, OE, OR> =>
    (stream) =>
      Stream.unwrap(
        Effect.gen(function* () {
          const context = yield* VideoContext;
          const { size } = yield* Effect.all(Effectable.options({ size: context.size }, options), {
            concurrency: "unbounded",
          });
          const frame = makeBitmap(size, color);

          return pipe(
            stream,
            Stream.take(duration),
            Stream.map(() => frame),
          );
        }),
      );

  const makeBitmap = ([width, height]: Size, color: VideoClip.RGBA): VideoClip.Bitmap => {
    return globalThis.Array.from({ length: height }, () => globalThis.Array.from({ length: width }, () => [...color]));
  };
}
