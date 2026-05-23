import { Stream } from "effect";
import type { AudioChunk } from "./media";

export namespace AudioClip {
  export interface AudioClip<E = never, R = never> {
    readonly render: Render<E, R>;
  }

  export type Render<E, R> = Stream.Stream<AudioChunk, E, R>;

  export const make = <E = never, R = never>(element: AudioClip<E, R>) => element;
}
