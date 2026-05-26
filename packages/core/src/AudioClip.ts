import { Stream } from "effect";

export namespace AudioClip {
  export interface Buffer {
    readonly samplerate: number;
    readonly channels: readonly Float32Array[];
  }

  export interface AudioClip<E = never, R = never> extends Stream.Stream<Buffer, E, R> {}

  export type Any = AudioClip<any, any>;
}
