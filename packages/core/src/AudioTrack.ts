import { Array, Effect, Stream } from "effect";

import { AudioClip } from "./AudioClip";
import { AudioContext } from "./AudioContext";
import type { AudioTick } from "./AudioTick";

export namespace AudioTrack {
  export type AudioTrack<IE = never, IR = never, OE = never, OR = never> = AudioClip.AudioClip<
    AudioTick,
    IE,
    IR,
    OE,
    OR
  >;

  export const make = <IE = never, IR = never, OE = never, OR = never>([head, ...tail]: readonly AudioClip.AudioClip<
    AudioTick,
    IE,
    IR,
    OE,
    OR
  >[]): Effect.Effect<AudioTrack<IE, IR, OE, OR>, never, AudioContext> =>
    AudioClip.make((stream) => {
      if (!head) return Stream.empty;

      const first: Stream.Stream<AudioClip.Channel[], OE, OR> = head(stream);

      return Array.reduce(tail, first, (track, clip) => Stream.concat(track, clip(stream)));
    });
}
