import { Effect, pipe, Stream } from "effect";

import type { Size } from "./Base";
import { Effectable } from "./Effectable";
import type { VideoClip } from "./VideoClip";
import { VideoContext } from "./VideoContext";
import type { VideoTick } from "./VideoTick";

export namespace Gap {
  /** Transparent video frames that occupy time between clips. */
  export interface Gap<E = never, R = never> extends VideoClip.VideoClip<
    VideoTick,
    never,
    never,
    E,
    R | VideoContext
  > {}

  /** Creates a transparent gap for the requested number of frames. */
  export const make =
    <E = never, R = never>(duration: Effectable<number, E, R>): Gap<E, R> =>
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
