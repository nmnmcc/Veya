import { Effect, Record } from "effect";

/** A value that may already be available or may be produced by an Effect. */
export type Effectable<A, E = never, R = never> = A | Effect.Effect<A, E, R>;

export namespace Effectable {
  /** Wraps a plain value or Effect into an Effect. */
  export const wrap = <A, E = never, R = never>(input: Effectable<A, E, R>): Effect.Effect<A, E, R> => {
    return Effect.isEffect(input) ? input : Effect.succeed(input);
  };

  /** Extracts the success type from an Effectable value. */
  export type Success<T> = T extends Effect.Effect<any, any, any> ? Effect.Success<T> : T;
  /** Extracts the error type from an Effectable value. */
  export type Error<T> = T extends Effect.Effect<any, any, any> ? Effect.Error<T> : never;
  /** Extracts required services from an Effectable value. */
  export type Services<T> = T extends Effect.Effect<any, any, any> ? Effect.Services<T> : never;

  /** Converts an Effectable type into an Effect type. */
  export type ToEffect<T> = Effect.Effect<Success<T>, Error<T>, Services<T>>;

  /** Converts every value in an options object into an Effect. */
  export const map = <A extends Record<any, Effectable<any, any, any>>>(
    input: A,
  ): {
    [K in keyof A]: ToEffect<A[K]>;
  } => Record.map(input, wrap) as never;

  /** Applies defaults and converts every option value into an Effect. */
  type OptionValue<D, O, K extends PropertyKey> = K extends keyof D
    ? D[K] | (K extends keyof O ? Exclude<O[K], undefined> : never)
    : K extends keyof O
      ? O[K]
      : never;

  export const options = <
    D extends Record<string, Effectable<any, any, any> | undefined>,
    O extends Partial<Record<keyof O, Effectable<any, any, any> | undefined>>,
  >(
    defaults: D,
    options: O,
  ): {
    [K in keyof D | keyof O]-?: ToEffect<OptionValue<D, O, K>>;
  } => {
    const merged = { ...defaults, ...options };

    return Record.map(merged, (value, key) => wrap(value ?? defaults[key as keyof D])) as never;
  };
}
