import { Effect, Record } from "effect";

export type Effectable<A, E = never, R = never> = A | Effect.Effect<A, E, R>;

export namespace Effectable {
  export const wrap = <A, E = never, R = never>(input: Effectable<A, E, R>): Effect.Effect<A, E, R> => {
    return Effect.isEffect(input) ? input : Effect.succeed(input);
  };

  export type Success<T extends Effectable<any, any, any>> =
    T extends Effect.Effect<any, any, any> ? Effect.Success<T> : T;
  export type Error<T extends Effectable<any, any, any>> =
    T extends Effect.Effect<any, any, any> ? Effect.Error<T> : never;
  export type Services<T extends Effectable<any, any, any>> =
    T extends Effect.Effect<any, any, any> ? Effect.Services<T> : never;

  export type ToEffect<T extends Effectable<any, any, any>> = Effect.Effect<Success<T>, Error<T>, Services<T>>;

  export const map = <A extends Record<any, Effectable<any, any, any>>>(
    input: A,
  ): {
    [K in keyof A]: ToEffect<A[K]>;
  } => Record.map(input, wrap) as never;
}
