import { Effect, pipe, Stream } from "effect";

import { CompositeVideoContext } from "@veya/core";
import type { Bitmap, FrameCount, RGBA, Size, VideoClip } from "@veya/core";

export namespace Color {
  export type Options<E = never, R = never> = {
    readonly size?: Effect.Effect<Size, E, R>;
  };

  export interface Color<E = never, R = never> extends VideoClip.VideoClip<E, R | CompositeVideoContext> {}

  export const make = <CE = never, CR = never, DE = never, DR = never, OE = never, OR = never>(
    color: Effect.Effect<RGBA, CE, CR>,
    duration: Effect.Effect<FrameCount, DE, DR>,
    options: Options<OE, OR> = {},
  ): Color<CE | DE | OE, CR | DR | OR> => {
    return Stream.unwrap(
      Effect.gen(function* () {
        const resolved = yield* Effect.all(
          {
            color,
            duration,
            size: options.size ?? CompositeVideoContext.use(({ size }) => Effect.succeed(size)),
          },
          { concurrency: "unbounded" },
        );
        const frame = makeBitmap(resolved.size, resolved.color);

        return pipe(
          Stream.range(0, resolved.duration - 1),
          Stream.map(() => frame),
        );
      }),
    );
  };

  const makeBitmap = ([width, height]: Size, color: RGBA): Bitmap => {
    return globalThis.Array.from({ length: height }, () => globalThis.Array.from({ length: width }, () => [...color]));
  };
}
