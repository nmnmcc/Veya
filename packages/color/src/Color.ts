import { Effect, pipe, Stream } from "effect";

import { VideoContext } from "@veya/core";
import { Effectable, type Size, VideoClip, VideoColor } from "@veya/core";

export namespace Color {
  export interface Color<I, E = never, R = never> extends VideoClip.VideoClip<I, never, never, E, R> {}

  export type Options<E = never, R = never> = {
    /** Frame size in pixels. Defaults to the active `VideoContext` size. */
    readonly size?: Effectable<Size, E, R> | undefined;
  };

  export const make = <I, OE = never, OR = never>(
    color: VideoColor.RGBA,
    duration: number,
    options: Options<OE, OR> = {},
  ): Effect.Effect<Color<I, OE, OR>, never, VideoContext> =>
    VideoClip.make((stream) =>
      Stream.unwrap(
        Effect.gen(function* () {
          const context = yield* VideoContext;
          const { size } = yield* Effect.all(Effectable.options({ size: context.size }, options), {
            concurrency: "unbounded",
          });
          const bitmap = VideoClip.Bitmap.make(size, VideoClip.Pixel.fromColor(color));

          return pipe(
            stream,
            Stream.take(duration),
            Stream.map(() => bitmap),
          );
        }),
      ),
    );
}
