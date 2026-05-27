import { Effect, pipe, Stream } from "effect";

import { Effectable, type Size, type VideoClip, VideoContext } from "@veya/core";

import { CanvasRenderer } from "./CanvasRenderer";

export namespace Canvas {
  export type Frame = CanvasRenderer.Frame;

  export type Draw<E = never, R = never> = CanvasRenderer.Draw<E, R>;

  export type Options<E = never, R = never> = {
    readonly size?: Effectable<Size, E, R>;
    readonly framerate?: Effectable<number, E, R>;
  };

  export interface Canvas<E = never, R = never> extends VideoClip.VideoClip<
    E | CanvasRenderer.CanvasRendererError,
    R | VideoContext | CanvasRenderer
  > {}

  export const make = <DE = never, DR = never, OE = never, OR = never>(
    draw: Draw<DE, DR>,
    duration: number,
    options: Options<OE, OR> = {},
  ): Canvas<DE | OE, DR | OR> =>
    Stream.unwrap(
      Effect.gen(function* () {
        const context = yield* VideoContext;
        const { size, framerate } = yield* Effect.all(
          Effectable.map({
            ...context,
            ...options,
          }),
          { concurrency: "unbounded" },
        );

        return pipe(
          Stream.range(0, duration - 1),
          Stream.mapEffect((index) =>
            CanvasRenderer.use(({ renderFrame }) =>
              renderFrame(draw, {
                index,
                time: index / framerate,
                duration,
                size,
                framerate,
              }),
            ),
          ),
        );
      }),
    );
}
