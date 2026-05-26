import { Effect, pipe, Stream } from "effect";

import { VideoCompositeContext } from "@veya/core";
import type { Size, VideoClip } from "@veya/core";

export namespace Color {
  export type Options<E = never, R = never> = {
    readonly size?: Effect.Effect<Size, E, R>;
  };

  export interface Color<E = never, R = never> extends VideoClip.VideoClip<E, R | VideoCompositeContext> {}

  export const make = <OE = never, OR = never>(
    color: VideoClip.RGBA,
    duration: number,
    options: Options<OE, OR> = {},
  ): Color<OE, OR> =>
    Stream.unwrap(
      Effect.gen(function* () {
        const size = yield* options.size ?? VideoCompositeContext.useSync(({ size }) => size);
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
