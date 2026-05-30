import { Array, Stream } from "effect";

import type { VideoClip } from "./VideoClip";

export namespace VideoTrack {
  export type VideoTrack<I, IE = never, IR = never, OE = never, OR = never> = VideoClip.VideoClip<I, IE, IR, OE, OR>;

  export const make =
    <I, IE = never, IR = never, OE = never, OR = never>([head, ...tail]: readonly VideoClip.VideoClip<
      I,
      IE,
      IR,
      OE,
      OR
    >[]): VideoTrack<I, IE, IR, OE, OR> =>
    (stream) => {
      if (!head) return Stream.empty;

      return Array.reduce(tail, head(stream), (track, clip) => Stream.concat(track, clip(stream)));
    };
}
