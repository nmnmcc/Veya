import { Stream } from "effect";

import type { Clip } from "./Base";

export namespace AudioClip {
  export type AudioClip<I, IE = never, IR = never, OE = never, OR = never> = Clip<I, Channel[], IE, IR, OE, OR>;

  export type Encodable<E = never, R = never> = Stream.Stream<Channel[], E, R>;

  /** A single audio channel as a stream of sample values. */
  export type Channel = Stream.Stream<number>;
}
