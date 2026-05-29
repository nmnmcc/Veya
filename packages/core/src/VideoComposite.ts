import { Array, Effect, pipe, Stream } from "effect";

import type { VideoClip } from "./VideoClip";
import { VideoColorSpace } from "./VideoColorSpace";
import { VideoCompositor } from "./VideoCompositor";
import { VideoContext } from "./VideoContext";
import type { VideoTick } from "./VideoTick";
import type { VideoTrack } from "./VideoTrack";

export namespace VideoComposite {
  export interface VideoComposite<IE = never, IR = never, OE = never, OR = never> extends VideoClip.VideoClip<
    VideoTick,
    IE,
    IR,
    OE,
    OR
  > {}

  export const make =
    <IE = never, IR = never, OE = never, OR = never>(
      tracks: readonly VideoTrack.VideoTrack<IE, IR, OE, OR>[],
    ): VideoComposite<IE, IR, OE | VideoCompositor.Error, OR | VideoContext | VideoCompositor> =>
    (stream) => {
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
