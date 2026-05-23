import { Array, Chunk, Context, Effect, Stream, pipe } from "effect";

export namespace Element {
  export interface Element<E = never, R = never> {
    readonly name: string;

    readonly rasterize: Stream.Stream<Uint8Array, E, R>;
  }

  export const make = <E = never, R = never>(element: Element<E, R>): Element<E, R> => element;
}

export namespace Sequence {
  export interface Sequence<E = never, R = never> extends Element.Element<E, R> {}

  export const make = <
    E = never,
    R = never,
    Tracks extends readonly Track.Track<E, R>[] = readonly Track.Track<E, R>[],
  >(
    name: string,
    tracks: Tracks,
  ): Sequence<E, R | Compositor.Service> => {
    return {
      name,
      rasterize: pipe(
        tracks,
        ([head, ...tail]) => {
          if (!head) return Stream.empty;

          return Array.reduce(
            tail,
            Stream.map(head.rasterize, (frame) => [frame]),
            (accumulator, track) =>
              Stream.zipWith(accumulator, track.rasterize, (frames, frame) => Array.append(frames, frame)),
          );
        },
        Stream.mapEffect((frames) => Compositor.Service.use((compositor) => compositor.composite(frames))),
      ),
    };
  };
}

export namespace Track {
  export interface Track<E = never, R = never> extends Chunk.Chunk<Element.Element<E, R>>, Element.Element<E, R> {}

  export const make = <E, R>(name: string, elements: Array<Element.Element<E, R>>): Track<E, R> => {
    return Object.assign(Chunk.fromArrayUnsafe(elements), {
      name,
      rasterize: Array.reduce(elements, Stream.empty as Stream.Stream<Uint8Array, E, R>, (a, c) =>
        Stream.concat(a, c.rasterize),
      ),
    });
  };
}

export namespace Compositor {
  export interface Compositor {
    readonly composite: (frames: Uint8Array[]) => Effect.Effect<Uint8Array>;
  }

  export class Service extends Context.Service<Service, Compositor>()("@veya/core/index/Service") {}
}
