import { Effect } from "effect";

export type Effectable<A, E = never, R = never> = A | Effect.Effect<A, E, R>;

export namespace Effectable {
  export const resolve = <A, E = never, R = never>(input: Effectable<A, E, R>): Effect.Effect<A, E, R> => {
    return Effect.isEffect(input) ? input : Effect.succeed(input);
  };
}
