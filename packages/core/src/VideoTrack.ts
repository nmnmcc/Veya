import { Array, pipe, Stream } from "effect";

import type { Bitmap } from "./media";
import type { VideoClip } from "./VideoClip";

export namespace VideoTrack {
  export interface VideoTrack<E = never, R = never> extends VideoClip.VideoClip<E, R> {}

  export type Any = VideoTrack<any, any>;

  type ClipError<Clips extends readonly VideoClip.Any[]> =
    Clips[number] extends Stream.Stream<any, infer E, any> ? E : never;

  type ClipContext<Clips extends readonly VideoClip.Any[]> =
    Clips[number] extends Stream.Stream<any, any, infer R> ? R : never;

  export const make = <const Clips extends readonly VideoClip.Any[]>(
    clips: Clips,
  ): VideoTrack<ClipError<Clips>, ClipContext<Clips>> => {
    return render(clips);
  };

  const render = <Clips extends readonly VideoClip.Any[]>([head, ...tail]: Clips): Stream.Stream<
    Bitmap,
    ClipError<Clips>,
    ClipContext<Clips>
  > => {
    if (!head) return Stream.empty;

    return pipe(
      Array.map(tail, (c) => c),
      Array.reduce(head, (a, c) => Stream.concat(a, c)),
    );
  };
}
