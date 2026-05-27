import { Effect, pipe, Stream } from "effect";

import { VideoContext } from "@veya/core";
import { Effectable, type Size, type VideoClip } from "@veya/core";

export namespace Color {
  export type Options<E = never, R = never> = {
    readonly size?: Effectable<Size, E, R>;
  };

  export interface Color<E = never, R = never> extends VideoClip.VideoClip<E, R | VideoContext> {}

  export const make = <OE = never, OR = never>(
    color: VideoClip.RGBA,
    duration: number,
    options: Options<OE, OR> = {},
  ): Color<OE, OR> =>
    Stream.unwrap(
      Effect.gen(function* () {
        const context = yield* VideoContext;
        const { size } = yield* Effect.all(
          Effectable.map({
            ...context,
            ...options,
          }),
          { concurrency: "unbounded" },
        );
        const frame = makeBitmap(size, color);

        return pipe(
          Stream.range(0, duration - 1),
          Stream.map(() => frame),
        );
      }),
    );

  const makeBitmap = ([width, height]: Size, color: VideoClip.RGBA): VideoClip.Bitmap => {
    return globalThis.Array.from({ length: height }, () => globalThis.Array.from({ length: width }, () => [...color]));
  };
}
