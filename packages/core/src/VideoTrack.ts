import { Array, Stream } from "effect";

import type { VideoClip } from "./VideoClip";
import type { VideoTick } from "./VideoTick";

export namespace VideoTrack {
  /** A video track made by playing video clips one after another. */
  export type VideoTrack<IE = never, IR = never, OE = never, OR = never> = VideoClip.VideoClip<
    VideoTick,
    IE,
    IR,
    OE,
    OR
  >;

  export const make =
    <IE = never, IR = never, OE = never, OR = never>([head, ...tail]: readonly VideoClip.VideoClip<
      VideoTick,
      IE,
      IR,
      OE,
      OR
    >[]): VideoTrack<IE, IR, OE, OR> =>
    (stream) => {
      if (!head) return Stream.empty;

      return Array.reduce(tail, head(stream), (track, clip) => Stream.concat(track, clip(stream)));
    };
}
