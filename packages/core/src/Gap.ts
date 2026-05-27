import { Effect, pipe, Stream } from "effect";

import { Effectable } from "./Effectable";
import type { Size } from "./Size";
import type { VideoClip } from "./VideoClip";
import { VideoContext } from "./VideoContext";

export namespace Gap {
  export interface Gap<E = never, R = never> extends VideoClip.VideoClip<E, R | VideoContext> {}

  export const make = <E = never, R = never>(duration: Effectable<number, E, R>): Gap<E, R> =>
    Stream.unwrap(
      VideoContext.use(({ size }) =>
        Effect.map(Effectable.wrap(duration), (duration) =>
          pipe(
            Stream.range(0, duration - 1),
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
