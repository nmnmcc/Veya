import { type Stream } from "effect";

export interface Encodable<C, A, E, R> extends Stream.Stream<A, E, R> {
  readonly context: C;
}

export namespace Encodable {
  export const make = <C, A, E = never, R = never>(stream: Stream.Stream<A, E, R>, context: C): Encodable<C, A, E, R> =>
    Object.assign(stream, { context });
}
