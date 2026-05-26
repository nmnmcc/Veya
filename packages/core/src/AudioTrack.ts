import { Array, Stream, pipe } from "effect";
import type { AudioChunk } from "./media";
import type { AudioClip } from "./AudioClip";

export namespace AudioTrack {
  export interface AudioTrack<E = never, R = never> extends AudioClip.AudioClip<E, R> {}

  export type Any = AudioTrack<any, any>;

  type ClipError<Clips extends readonly AudioClip.Any[]> =
    Clips[number] extends Stream.Stream<any, infer E, any> ? E : never;

  type ClipContext<Clips extends readonly AudioClip.Any[]> =
    Clips[number] extends Stream.Stream<any, any, infer R> ? R : never;

  export const make = <const Clips extends readonly AudioClip.Any[]>(
    clips: Clips,
  ): AudioTrack<ClipError<Clips>, ClipContext<Clips>> => {
    return render(clips);
  };

  const render = <Clips extends readonly AudioClip.Any[]>([head, ...tail]: Clips): Stream.Stream<
    AudioChunk,
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
