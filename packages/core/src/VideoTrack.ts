import { Array, Stream } from "effect";

import type { VideoClip } from "./VideoClip";

export namespace VideoTrack {
  export interface VideoTrack<E = never, R = never> extends VideoClip.VideoClip<E, R> {}

  export type Any = VideoTrack<any, any>;

  export const make = <const Clips extends readonly VideoClip.Any[]>([head, ...tail]: Clips): VideoTrack<
    Stream.Error<Clips[number]>,
    Stream.Services<Clips[number]>
  > => {
    if (!head) return Stream.empty;

    return Array.reduce(tail, head, (a, c) => Stream.concat(a, c));
  };
}
