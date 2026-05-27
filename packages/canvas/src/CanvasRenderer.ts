import { Context, Data, Effect, Layer } from "effect";

import type { Size, VideoClip } from "@veya/core";

export class CanvasRenderer extends Context.Service<CanvasRenderer, CanvasRenderer.CanvasRenderer>()(
  "@veya/canvas/CanvasRenderer",
) {}

export namespace CanvasRenderer {
  export type RenderingContext2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

  export interface Frame {
    readonly index: number;
    readonly time: number;
    readonly duration: number;
    readonly size: Size;
    readonly framerate: number;
  }

  export type Draw<E = never, R = never> = (context: RenderingContext2D, frame: Frame) => Effect.Effect<void, E, R>;

  export class CanvasRendererError extends Data.TaggedError("CanvasRendererError")<{
    readonly reason?: unknown;
  }> {}

  export interface CanvasRenderer {
    readonly renderFrame: <E = never, R = never>(
      draw: Draw<E, R>,
      frame: Frame,
    ) => Effect.Effect<VideoClip.Bitmap, E | CanvasRendererError, R>;
  }

  export const makeOffscreen = (): CanvasRenderer => ({
    renderFrame: (draw, frame) =>
      Effect.gen(function* () {
        const context = yield* makeContext(frame.size);
        const drawing = yield* Effect.try({
          try: () => draw(context, frame),
          catch: (reason) => new CanvasRendererError({ reason }),
        });

        yield* drawing;

        const image = yield* getImageData(context, frame.size);

        return imageDataToBitmap(image, frame.size);
      }),
  });

  export const layer = Layer.succeed(CanvasRenderer, makeOffscreen());

  const makeContext = ([width, height]: Size): Effect.Effect<RenderingContext2D, CanvasRendererError> =>
    Effect.try({
      try: () => {
        if (typeof OffscreenCanvas === "undefined") {
          throw new Error("OffscreenCanvas is not available in this runtime");
        }

        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Could not create a 2D OffscreenCanvas context");
        }

        return context;
      },
      catch: (reason) => new CanvasRendererError({ reason }),
    });

  const getImageData = (
    context: RenderingContext2D,
    [width, height]: Size,
  ): Effect.Effect<ImageData, CanvasRendererError> =>
    Effect.try({
      try: () => context.getImageData(0, 0, width, height),
      catch: (reason) => new CanvasRendererError({ reason }),
    });

  const imageDataToBitmap = ({ data }: ImageData, [width, height]: Size): VideoClip.Bitmap => {
    let offset = 0;

    return globalThis.Array.from({ length: height }, () =>
      globalThis.Array.from({ length: width }, () => {
        const pixel = [data[offset] ?? 0, data[offset + 1] ?? 0, data[offset + 2] ?? 0, data[offset + 3] ?? 0] as const;
        offset += 4;

        return pixel;
      }),
    );
  };
}
