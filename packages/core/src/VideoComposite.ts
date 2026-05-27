import { Array, Effect, pipe, Stream } from "effect";

import type { VideoClip } from "./VideoClip";
import { VideoColorSpace } from "./VideoColorSpace";
import { VideoCompositor } from "./VideoCompositor";
import { VideoContext } from "./VideoContext";
import type { VideoTrack } from "./VideoTrack";

export namespace VideoComposite {
  export interface VideoComposite<E = never, R = never> extends VideoClip.VideoClip<E, R> {}

  export const make = <E = never, R = never>(
    tracks: readonly VideoTrack.VideoTrack<E, R>[],
  ): VideoComposite<E | VideoCompositor.VideoCompositorError, R | VideoContext | VideoCompositor> => {
    return pipe(
      tracks,
      ([head, ...tail]) => {
        if (!head) return Stream.empty;

        return Array.reduce(
          tail,
          Stream.map(head, (frame) => [frame]),
          (a, c) => Stream.zipWith(a, c, (frames, frame) => Array.append(frames, frame)),
        );
      },
      Stream.mapEffect((frames) =>
        VideoContext.pipe(
          Effect.flatMap(({ colorSpace, size }) =>
            VideoCompositor.use(({ composite }) =>
              composite(frames, {
                colorSpace: colorSpace ?? VideoColorSpace.Default,
                size,
              }),
            ),
          ),
        ),
      ),
    );
  };
}
