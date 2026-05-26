import { Array, Effect, pipe, Stream } from "effect";

import type { AudioClip } from "./AudioClip";
import { AudioContext } from "./AudioContext";
import { AudioMixer } from "./AudioMixer";
import type { AudioTrack } from "./AudioTrack";

export namespace AudioMix {
  export interface AudioMix<E = never, R = never> extends AudioClip.AudioClip<E, R> {}

  export type Any = AudioMix<any, any>;

  export const make = <const Tracks extends readonly AudioTrack.Any[]>(
    tracks: Tracks,
  ): AudioMix<
    Stream.Error<Tracks[number]> | AudioMixer.AudioCompositorError,
    Stream.Services<Tracks[number]> | AudioContext | AudioMixer
  > => {
    return pipe(
      tracks,
      ([head, ...tail]) => {
        if (!head) return Stream.empty;

        return Array.reduce(
          tail,
          Stream.map(head, (buffer) => [buffer]),
          (a, c) => Stream.zipWith(a, c, (buffers, buffer) => Array.append(buffers, buffer)),
        );
      },
      Stream.mapEffect((buffers) =>
        AudioContext.pipe(
          Effect.flatMap(({ samplerate, channels }) =>
            AudioMixer.use(({ mix }) => mix(buffers, { samplerate, channels })),
          ),
        ),
      ),
    );
  };
}
