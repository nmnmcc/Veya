import { Array, Effect, pipe, Stream } from "effect";

import { VideoClip } from "./VideoClip";
import { VideoCompositor } from "./VideoCompositor";
import { VideoContext } from "./VideoContext";
import type { VideoTrack } from "./VideoTrack";

export namespace VideoComposite {
  export interface VideoComposite<I, IE = never, IR = never, OE = never, OR = never> extends VideoClip.VideoClip<
    I,
    IE,
    IR,
    OE,
    OR
  > {}

  export const make = <I, IE = never, IR = never, OE = never, OR = never>(
    tracks: readonly VideoTrack.VideoTrack<I, IE, IR, OE, OR>[],
  ): Effect.Effect<VideoComposite<I, IE, IR, OE | VideoCompositor.Error, OR | VideoCompositor>, never, VideoContext> =>
    VideoClip.make((stream) => {
      return pipe(
        tracks,
        ([head, ...tail]) => {
          if (!head) return Stream.empty;

          return Array.reduce(
            tail,
            Stream.map(head(stream), (frame) => [frame]),
            (frames, track) => Stream.zipWith(frames, track(stream), (frames, frame) => Array.append(frames, frame)),
          );
        },
        Stream.mapEffect((frames) =>
          VideoContext.pipe(
            Effect.flatMap(({ colorSpace, size }) =>
              VideoCompositor.use(({ composite }) =>
                composite(frames, {
                  colorSpace,
                  size,
                }),
              ),
            ),
          ),
        ),
      );
    });
}
