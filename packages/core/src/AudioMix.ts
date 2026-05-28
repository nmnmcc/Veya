import { Array, Effect, pipe, Stream } from "effect";

import type { AudioClip } from "./AudioClip";
import { AudioContext } from "./AudioContext";
import { AudioMixer } from "./AudioMixer";
import type { AudioTrack } from "./AudioTrack";

export namespace AudioMix {
  export interface AudioMix<E = never, R = never> extends AudioClip.AudioClip<E, R> {}

  export const make = <E = never, R = never>(
    tracks: readonly AudioTrack.AudioTrack<E, R>[],
  ): AudioMix<E | AudioMixer.Error, R | AudioContext | AudioMixer> => {
    return pipe(
      tracks,
      ([head, ...tail]) => {
        if (!head) return Stream.empty;

        return Array.reduce(
          tail,
          Stream.map(head, (channels) => [channels]),
          (a, c) => Stream.zipWith(a, c, (channelGroups, channels) => Array.append(channelGroups, channels)),
        );
      },
      Stream.mapEffect((channelGroups) =>
        AudioContext.pipe(
          Effect.flatMap(({ samplerate, channels }) =>
            AudioMixer.use(({ mix }) => mix(channelGroups, { samplerate, channels })),
          ),
        ),
      ),
    );
  };
}
