import { Array, Stream } from "effect";

import type { VideoClip } from "./VideoClip";

export namespace VideoTrack {
  export interface VideoTrack<E = never, R = never> extends VideoClip.VideoClip<E, R> {}

  export const make = <E = never, R = never>([head, ...tail]: readonly VideoClip.VideoClip<E, R>[]): VideoTrack<
    E,
    R
  > => {
    if (!head) return Stream.empty;

    return Array.reduce(tail, head, (a, c) => Stream.concat(a, c));
  };
}
