import { Array, Stream } from "effect";

import type { AudioClip } from "./AudioClip";

export namespace AudioTrack {
  export interface AudioTrack<E = never, R = never> extends AudioClip.AudioClip<E, R> {}

  export type Any = AudioTrack<any, any>;

  export const make = <const Clips extends readonly AudioClip.Any[]>([head, ...tail]: Clips): AudioTrack<
    Stream.Error<Clips[number]>,
    Stream.Services<Clips[number]>
  > => {
    if (!head) return Stream.empty;

    return Array.reduce(tail, head, (a, c) => Stream.concat(a, c));
  };
}
