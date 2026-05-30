import { Effect, Function, Stream } from "effect";

import { AudioContext } from "./AudioContext";
import type { Clip } from "./Base";

export namespace AudioClip {
  export type AudioClip<I, IE = never, IR = never, OE = never, OR = never> = Clip<I, Channel[], IE, IR, OE, OR>;

  export interface Encodable<E = never, R = never> extends Stream.Stream<Channel[], E, R> {
    readonly context: AudioContext.AudioContext;
  }

  /** Creates an audio clip from a stream transformer. */
  export const make = <I, IE = never, IR = never, OE = never, OR = never>(
    clip: AudioClip<I, IE, IR, OE, OR>,
  ): AudioClip<I, IE, IR, OE, OR> => clip;

  /** A single audio channel as a stream of sample values. */
  export type Channel = Stream.Stream<number>;

  export const toEncodable: {
    <I, IE = never, IR = never, OE = never, OR = never>(
      clip: AudioClip<I, IE, IR, OE, OR>,
    ): (
      tick: Stream.Stream<I, IE, IR>,
    ) => Effect.Effect<Encodable<IE | OE, Exclude<IR | OR, AudioContext>>, never, AudioContext>;
    <I, IE = never, IR = never, OE = never, OR = never>(
      tick: Stream.Stream<I, IE, IR>,
      clip: AudioClip<I, IE, IR, OE, OR>,
    ): Effect.Effect<Encodable<IE | OE, Exclude<IR | OR, AudioContext>>, never, AudioContext>;
  } = Function.dual(
    2,
    <I, IE = never, IR = never, OE = never, OR = never>(
      tick: Stream.Stream<I, IE, IR>,
      clip: AudioClip<I, IE, IR, OE, OR>,
    ): Effect.Effect<Encodable<IE | OE, Exclude<IR | OR, AudioContext>>, never, AudioContext> =>
      Effect.gen(function* () {
        const context = yield* AudioContext;

        return Object.assign(clip(tick).pipe(Stream.provideService(AudioContext, context)), {
          context,
        });
      }),
  );
}
