import { Effect, pipe, Stream } from "effect";

import { Effectable, type Size, type VideoClip, VideoColorSpace, VideoContext } from "@veya/core";

import { CanvasRenderer } from "./CanvasRenderer";

export namespace Canvas {
  export type Frame = CanvasRenderer.Frame;

  export type Draw<E = never, R = never> = CanvasRenderer.Draw<E, R>;

  export type Options<E = never, R = never> = {
    readonly size?: Effectable<Size, E, R> | undefined;
    readonly framerate?: Effectable<number, E, R> | undefined;
    readonly colorSpace?: Effectable<VideoColorSpace.VideoColorSpace, E, R> | undefined;
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
        const { colorSpace, size, framerate } = yield* Effect.all(
          Effectable.mapOptions<
            Pick<VideoContext.VideoContext, "size" | "framerate"> & {
              readonly colorSpace: VideoColorSpace.VideoColorSpace;
            },
            OE,
            OR
          >(
            {
              size: context.size,
              framerate: context.framerate,
              colorSpace: context.colorSpace ?? VideoColorSpace.Default,
            },
            options,
          ),
          { concurrency: "unbounded" },
        );

        return pipe(
          Stream.range(0, duration - 1),
          Stream.mapEffect((index) =>
            CanvasRenderer.use(({ render: renderFrame }) =>
              renderFrame(draw, {
                index,
                time: index / framerate,
                duration,
                size,
                framerate,
                colorSpace,
              }),
            ),
          ),
        );
      }),
    );
}
