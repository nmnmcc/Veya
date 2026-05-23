import { Effect, Stream } from "effect";
import { Effectable } from "./Effectable";
import type { AudioChunk } from "./media";

export namespace AudioClip {
  export interface AudioClip<E = never, R = never> {
    readonly render: Render<E, R>;
  }

  export type Render<E, R> = Stream.Stream<AudioChunk, E, R>;

  export const make = <ClipE = never, ClipR = never, E = never, R = never>(
    element: Effectable<AudioClip<ClipE, ClipR>, E, R>,
  ): AudioClip<ClipE | E, ClipR | R> => ({
    render: Stream.unwrap(Effect.map(Effectable.resolve(element), (element) => element.render)),
  });
}
