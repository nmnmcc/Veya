import { Stream } from "effect";

export namespace AudioClip {
  export type Channel = Stream.Stream<number>;

  export interface AudioClip<E = never, R = never> extends Stream.Stream<Channel[], E, R> {}
}
