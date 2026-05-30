import { Effect, pipe, Stream } from "effect";

import type { Size } from "./Base";
import { Effectable } from "./Effectable";
import type { VideoClip } from "./VideoClip";
import { VideoContext } from "./VideoContext";

export namespace Gap {
  export interface Gap<I, E = never, R = never> extends VideoClip.VideoClip<I, never, never, E, R | VideoContext> {}

  export const make =
    <I, E = never, R = never>(duration: Effectable<number, E, R>): Gap<I, E, R> =>
    (stream) =>
      Stream.unwrap(
        VideoContext.use(({ size }) =>
          Effect.map(Effectable.wrap(duration), (duration) =>
            pipe(
              stream,
              Stream.take(duration),
              Stream.map(() => makeZeroBitmap(size)),
            ),
          ),
        ),
      );

  const makeZeroBitmap = ([width, height]: Size): VideoClip.Bitmap => {
    return globalThis.Array.from({ length: height }, () =>
      globalThis.Array.from({ length: width }, () => [0, 0, 0, 0]),
    );
  };
}
