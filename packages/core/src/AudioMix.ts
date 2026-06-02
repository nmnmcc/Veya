import { Array, Effect, Stream } from "effect";

import { AudioClip } from "./AudioClip";
import { AudioContext } from "./AudioContext";
import { AudioMixer } from "./AudioMixer";
import type { AudioTick } from "./AudioTick";
import type { AudioTrack } from "./AudioTrack";

export namespace AudioMix {
  export interface AudioMix<IE = never, IR = never, OE = never, OR = never> extends AudioClip.AudioClip<
    AudioTick,
    IE,
    IR,
    OE,
    OR
  > {}

  export const make = <IE = never, IR = never, OE = never, OR = never>([head, ...tail]: readonly AudioTrack.AudioTrack<
    IE,
    IR,
    OE,
    OR
  >[]): Effect.Effect<AudioMix<IE, IR, OE | AudioMixer.Error, OR | AudioMixer>, never, AudioContext> =>
    AudioClip.make((stream) => {
      if (!head) return Stream.empty;

      const groups = Array.reduce(
        tail,
        Stream.map(head(stream), (channels) => [channels]),
        (groups, track) => Stream.zipWith(groups, track(stream), (groups, channels) => Array.append(groups, channels)),
      );

      return Stream.mapEffect(groups, (groups) =>
        Effect.gen(function* () {
          const { samplerate, channels } = yield* AudioContext;
          const { mix } = yield* AudioMixer;

          return yield* mix(groups, { samplerate, channels });
        }),
      );
    });
}
