import { Array, Stream } from "effect";

import type { AudioClip } from "./AudioClip";
import type { AudioTick } from "./AudioTick";

export namespace AudioTrack {
  /** An audio track made by playing audio clips one after another. */
  export type AudioTrack<IE = never, IR = never, OE = never, OR = never> = AudioClip.AudioClip<
    AudioTick,
    IE,
    IR,
    OE,
    OR
  >;

  /** Concatenates clips into a single audio track. */
  export const make =
    <IE = never, IR = never, OE = never, OR = never>([head, ...tail]: readonly AudioClip.AudioClip<
      AudioTick,
      IE,
      IR,
      OE,
      OR
    >[]): AudioTrack<IE, IR, OE, OR> =>
    (stream) => {
      if (!head) return Stream.empty;

      return Array.reduce(tail, head(stream), (track, clip) => Stream.concat(track, clip(stream)));
    };
}
