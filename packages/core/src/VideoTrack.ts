import { Array, Stream, pipe } from "effect";
import type { Bitmap } from "./media";
import type { VideoClip } from "./VideoClip";

export namespace VideoTrack {
  export interface VideoTrack<E = never, R = never> extends VideoClip.VideoClip<E, R> {}

  export const make = <Clips extends readonly VideoClip.VideoClip<E, R>[], E = never, R = never>(
    clips: Clips,
  ): VideoTrack<E, R> => {
    if (Array.isReadonlyArrayEmpty(clips))
      return {
        render: Stream.empty,
      };

    return {
      render: pipe(
        clips,
        Array.map((c) => c.render),
        Array.reduce(Stream.empty as Stream.Stream<Bitmap, E, R>, (a, c) => Stream.concat(a, c)),
      ),
    };
  };
}
