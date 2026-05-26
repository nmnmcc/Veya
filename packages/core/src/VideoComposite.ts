import { Array, Effect, pipe, Stream } from "effect";

import type { VideoClip } from "./VideoClip";
import { VideoCompositor } from "./VideoCompositor";
import { VideoContext } from "./VideoContext";
import type { VideoTrack } from "./VideoTrack";

export namespace VideoComposite {
  export interface VideoComposite<E = never, R = never> extends VideoClip.VideoClip<E, R> {}

  export type Any = VideoComposite<any, any>;

  export const make = <const Tracks extends readonly VideoTrack.Any[]>(
    tracks: Tracks,
  ): VideoComposite<
    Stream.Error<Tracks[number]> | VideoCompositor.VideoCompositorError,
    Stream.Services<Tracks[number]> | VideoContext | VideoCompositor
  > => {
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
          Effect.flatMap(({ size }) => VideoCompositor.use(({ composite }) => composite(frames, { size }))),
        ),
      ),
    );
  };
}
