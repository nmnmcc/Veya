import { Array, Stream, pipe } from "effect";
import type { AudioChunk } from "./media";
import type { AudioClip } from "./AudioClip";

export namespace AudioTrack {
  export interface AudioTrack<E = never, R = never> extends AudioClip.AudioClip<E, R> {}

  export const make = <Clips extends readonly AudioClip.AudioClip<E, R>[], E = never, R = never>(
    clips: Clips,
  ): AudioTrack<E, R> => {
    if (Array.isReadonlyArrayEmpty(clips))
      return {
        render: Stream.empty,
      };

    return {
      render: pipe(
        clips,
        Array.map((c) => c.render),
        Array.reduce(Stream.empty as Stream.Stream<AudioChunk, E, R>, (a, c) => Stream.concat(a, c)),
      ),
    };
  };
}
