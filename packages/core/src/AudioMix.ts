import { Array, Effect, pipe, Stream } from "effect";

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

  export const make = <IE = never, IR = never, OE = never, OR = never>(
    tracks: readonly AudioTrack.AudioTrack<IE, IR, OE, OR>[],
  ): Effect.Effect<AudioMix<IE, IR, OE | AudioMixer.Error, OR | AudioMixer>, never, AudioContext> =>
    AudioClip.make((stream) => {
      return pipe(
        tracks,
        ([head, ...tail]) => {
          if (!head) return Stream.empty;

          return Array.reduce(
            tail,
            Stream.map(head(stream), (channels) => [channels]),
            (channelGroups, track) =>
              Stream.zipWith(channelGroups, track(stream), (channelGroups, channels) =>
                Array.append(channelGroups, channels),
              ),
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
    });
}
