import { Array, Effect, Stream, pipe } from "effect";
import { Effectable } from "./Effectable";
import type { Bitmap } from "./media";
import type { VideoClip } from "./VideoClip";

export namespace VideoTrack {
  export interface VideoTrack<E = never, R = never> extends VideoClip.VideoClip<E, R> {}

  export const make = <
    Clips extends readonly VideoClip.VideoClip<ClipE, ClipR>[],
    ClipE = never,
    ClipR = never,
    E = never,
    R = never,
  >(
    clips: Effectable<Clips, E, R>,
  ): VideoTrack<ClipE | E, ClipR | R> => {
    return {
      render: Stream.unwrap(Effect.map(Effectable.resolve(clips), renderClips)),
    };
  };

  const renderClips = <E, R>(clips: readonly VideoClip.VideoClip<E, R>[]): Stream.Stream<Bitmap, E, R> => {
    if (Array.isReadonlyArrayEmpty(clips)) return Stream.empty;

    return pipe(
      clips,
      Array.map((c) => c.render),
      Array.reduce(Stream.empty as Stream.Stream<Bitmap, E, R>, (a, c) => Stream.concat(a, c)),
    );
  };
}
