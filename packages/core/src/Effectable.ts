import { Effect } from "effect";
import type { Types } from "effect";

export type Effectable<A, E = never, R = never> = A | Effect.Effect<A, E, R>;

export namespace Effectable {
  type EffectableAny = Effectable<any, any, any>;

  type EffectPart<T> = Extract<T, Effect.Effect<any, any, any>>;

  type ToEffect<T> = Effect.Effect<
    Exclude<T, Effect.Effect<any, any, any>> | (EffectPart<T> extends Effect.Effect<infer A, any, any> ? A : never),
    EffectPart<T> extends Effect.Effect<any, infer E, any> ? E : never,
    EffectPart<T> extends Effect.Effect<any, any, infer R> ? R : never
  >;

  type ToEffects<T> = [T] extends [ReadonlyArray<unknown>]
    ? { readonly [K in keyof T]: ToEffect<T[K]> }
    : [T] extends [Iterable<infer A>]
      ? Iterable<ToEffect<A>>
      : [T] extends [Record<string, unknown>]
        ? { readonly [K in keyof T]: ToEffect<T[K]> }
        : never;

  type AllOptions = {
    readonly concurrency?: Types.Concurrency | undefined;
    readonly discard?: boolean | undefined;
    readonly mode?: "default" | "result" | undefined;
  };

  const isIterable = (input: unknown): input is Iterable<EffectableAny> => {
    return (
      input !== null &&
      input !== undefined &&
      typeof (input as { [Symbol.iterator]?: unknown })[Symbol.iterator] === "function"
    );
  };

  export const resolve = <A, E = never, R = never>(input: Effectable<A, E, R>): Effect.Effect<A, E, R> => {
    return Effect.isEffect(input) ? input : Effect.succeed(input);
  };

  export const all = <
    const Arg extends Iterable<EffectableAny> | Record<string, EffectableAny>,
    const Options extends AllOptions = {},
  >(
    input: Arg,
    options?: Options,
  ): Effect.All.Return<ToEffects<Arg>, Options> => {
    const effects = Array.isArray(input)
      ? input.map(resolve)
      : isIterable(input)
        ? Array.from(input, resolve)
        : Object.fromEntries(Object.entries(input).map(([key, value]) => [key, resolve(value)]));

    return Effect.all(effects, options) as Effect.All.Return<ToEffects<Arg>, Options>;
  };
}
