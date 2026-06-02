import { Effect, Stream } from "effect";

import { AudioContext } from "./AudioContext";
import type { Clip } from "./Base";
import { Encodable } from "./Encodable";

export namespace AudioClip {
  export type AudioClip<I, IE = never, IR = never, OE = never, OR = never> = Clip<
    AudioContext.AudioContext,
    I,
    Channel[],
    IE,
    IR,
    OE,
    OR
  >;

  export type Encodable<E = never, R = never> = ReturnType<AudioClip<never, never, never, E, R>>;

  /** Creates an audio clip from a stream transformer. */
  export const make = <I, IE = never, IR = never, OE = never, OR = never>(
    clip: (stream: Stream.Stream<I, IE, IR>) => Stream.Stream<Channel[], OE, OR>,
  ): Effect.Effect<AudioClip<I, IE, IR, OE, Exclude<OR, AudioContext>>, never, AudioContext> =>
    Effect.gen(function* () {
      const context = yield* AudioContext;

      return (stream: Stream.Stream<I, IE, IR>) =>
        Encodable.make(clip(stream).pipe(Stream.provideService(AudioContext, context)), context);
    });

  /** A single audio channel as a stream of sample values. */
  export type Channel = Stream.Stream<number>;
}
