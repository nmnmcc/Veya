import { type Stream } from "effect";

export interface Encodable<C, A, E, R> extends Stream.Stream<A, E, R> {
  readonly context: C;
}

export namespace Encodable {
  export const make = <C, A, E = never, R = never>(
    stream: Stream.Stream<A, E, R>,
    context: C,
  ): Encodable<C, A, E, R> => {
    const encodable = Object.create(Object.getPrototypeOf(stream)) as Encodable<C, A, E, R>;

    // @effect-diagnostics-next-line floatingEffect:off
    Object.defineProperties(encodable, Object.getOwnPropertyDescriptors(stream));
    // @effect-diagnostics-next-line floatingEffect:off
    Object.defineProperty(encodable, "context", {
      configurable: true,
      enumerable: true,
      value: context,
      writable: false,
    });

    return encodable;
  };
}
