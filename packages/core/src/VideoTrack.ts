import { Array, Effect, Stream } from "effect";

import { VideoClip } from "./VideoClip";
import { VideoContext } from "./VideoContext";

export namespace VideoTrack {
  export type VideoTrack<I, IE = never, IR = never, OE = never, OR = never> = VideoClip.VideoClip<I, IE, IR, OE, OR>;

  export const make = <I, IE = never, IR = never, OE = never, OR = never>([head, ...tail]: readonly VideoClip.VideoClip<
    I,
    IE,
    IR,
    OE,
    OR
  >[]): Effect.Effect<VideoTrack<I, IE, IR, OE, OR>, never, VideoContext> =>
    VideoClip.make((stream) => {
      if (!head) return Stream.empty;

      const first: Stream.Stream<VideoClip.Bitmap, OE, OR> = head(stream);

      return Array.reduce(tail, first, (track, clip) => Stream.concat(track, clip(stream)));
    });
}
