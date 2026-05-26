import { Stream } from "effect";

import type { AudioChunk } from "./media";

export namespace AudioClip {
  export interface AudioClip<E = never, R = never> extends Stream.Stream<AudioChunk, E, R> {}

  export type Any = AudioClip<any, any>;
}
