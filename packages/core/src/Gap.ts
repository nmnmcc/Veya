import { Effect, Stream, pipe } from "effect";
import { CompositeVideoContext } from "./CompositeVideoContext";
import { Effectable } from "./Effectable";
import type { Bitmap, FrameCount, Size } from "./media";
import { VideoClip } from "./VideoClip";

export namespace Gap {
  export interface Gap<E = never, R = never> extends VideoClip.VideoClip<E, R | CompositeVideoContext> {}

  export const make = <E = never, R = never>(duration: Effectable<FrameCount, E, R>): Gap<E, R> => ({
    render: Stream.unwrap(
      CompositeVideoContext.use(({ size }) =>
        Effect.map(Effectable.resolve(duration), (duration) =>
          pipe(
            Stream.range(0, duration - 1),
            Stream.map(() => makeZeroBitmap(size)),
          ),
        ),
      ),
    ),
  });

  const makeZeroBitmap = ([width, height]: Size): Bitmap => {
    return globalThis.Array.from({ length: height }, () =>
      globalThis.Array.from({ length: width }, () => [0, 0, 0, 0]),
    );
  };
}
