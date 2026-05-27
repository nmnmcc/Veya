import { Array, Stream } from "effect";

import type { AudioClip } from "./AudioClip";

export namespace AudioTrack {
  export interface AudioTrack<E = never, R = never> extends AudioClip.AudioClip<E, R> {}

  export const make = <E = never, R = never>([head, ...tail]: readonly AudioClip.AudioClip<E, R>[]): AudioTrack<
    E,
    R
  > => {
    if (!head) return Stream.empty;

    return Array.reduce(tail, head, (a, c) => Stream.concat(a, c));
  };
}
