import { Array, Effect, Stream, pipe } from "effect";
import { Effectable } from "./Effectable";
import type { AudioChunk } from "./media";
import type { AudioClip } from "./AudioClip";

export namespace AudioTrack {
  export interface AudioTrack<E = never, R = never> extends AudioClip.AudioClip<E, R> {}

  export const make = <
    Clips extends readonly AudioClip.AudioClip<ClipE, ClipR>[],
    ClipE = never,
    ClipR = never,
    E = never,
    R = never,
  >(
    clips: Effectable<Clips, E, R>,
  ): AudioTrack<ClipE | E, ClipR | R> => {
    return {
      render: Stream.unwrap(Effect.map(Effectable.resolve(clips), renderClips)),
    };
  };

  const renderClips = <E, R>(clips: readonly AudioClip.AudioClip<E, R>[]): Stream.Stream<AudioChunk, E, R> => {
    if (Array.isReadonlyArrayEmpty(clips)) return Stream.empty;

    return pipe(
      clips,
      Array.map((c) => c.render),
      Array.reduce(Stream.empty as Stream.Stream<AudioChunk, E, R>, (a, c) => Stream.concat(a, c)),
    );
  };
}
