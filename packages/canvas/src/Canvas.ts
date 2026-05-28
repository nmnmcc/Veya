import { Effect, pipe, Ref, Stream } from "effect";

import { Effectable, type Size, type VideoClip, VideoColorSpace, VideoContext } from "@veya/core";

import { CanvasRenderingContext } from "./CanvasRenderingContext";

export namespace Canvas {
  export interface Canvas<E = never, R = never> extends VideoClip.VideoClip<
    E | CanvasRenderingContext.Error,
    R | VideoContext | CanvasRenderingContext
  > {}

  export type Options<E = never, R = never> = {
    readonly size?: Effectable<Size, E, R> | undefined;
    readonly framerate?: Effectable<number, E, R> | undefined;
    readonly colorSpace?: Effectable<VideoColorSpace.VideoColorSpace, E, R> | undefined;
  };

  export type Draw<S, E, R> = (
    index: number,
    state: S,
    options: Options,
  ) => Effect.Effect<S, E, R | CanvasRenderingContext>;

  export const make = <S, IE = never, IR = never, DE = never, DR = never, OE = never, OR = never>(
    init: Effect.Effect<S, IE, IR>,
    draw: Draw<S, DE, DR>,
    duration: number,
    options: Options<OE, OR> = {},
  ): Canvas<IE | DE | OE, IR | DR | OR> =>
    Stream.unwrap(
      Effect.gen(function* () {
        const video = yield* VideoContext;
        const { make, snapshot } = yield* CanvasRenderingContext;
        const _options = yield* Effect.all(
          Effectable.options(
            {
              size: video.size,
              framerate: video.framerate,
              colorSpace: video.colorSpace ?? VideoColorSpace.Default,
            },
            options,
          ),
          { concurrency: "unbounded" },
        );

        const context = yield* make(_options.size, _options);

        const state = yield* Ref.make(yield* init);
        return pipe(
          Stream.range(0, duration - 1),
          Stream.mapEffect((index) =>
            Effect.gen(function* () {
              const s = yield* Ref.get(state);
              const r = yield* draw(index, s, _options);
              yield* Ref.set(state, r);

              return snapshot(context, _options.size);
            }),
          ),
          Stream.provideService(CanvasRenderingContext.Context2D, context),
        );
      }),
    );
}
