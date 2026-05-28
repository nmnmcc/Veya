import { Effect, pipe, Stream } from "effect";

import { VideoContext, type VideoTick } from "@veya/core";
import { Effectable, type Size, type VideoClip } from "@veya/core";

export namespace Color {
  /** Options for creating a solid-color clip. */
  export type Options<E = never, R = never> = {
    /** Frame size in pixels. Defaults to the active `VideoContext` size. */
    readonly size?: Effectable<Size, E, R> | undefined;
  };

  /** A video clip that repeats the same solid-color frame. */
  export interface Color<E = never, R = never> extends VideoClip.VideoClip<
    VideoTick,
    never,
    never,
    E,
    R | VideoContext
  > {}

  /** Creates a solid-color video clip for the requested number of frames. */
  export const make =
    <OE = never, OR = never>(color: VideoClip.RGBA, duration: number, options: Options<OE, OR> = {}): Color<OE, OR> =>
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
