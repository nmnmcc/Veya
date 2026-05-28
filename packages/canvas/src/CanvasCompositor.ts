import { Effect, Layer } from "effect";

import { VideoClip, VideoCompositor } from "@veya/core";

import { CanvasRenderingContext, type CanvasRenderingContext2D } from "./CanvasRenderingContext";

export namespace CanvasCompositor {
  /** Creates a canvas-backed video compositor service implementation. */
  export const make = (): VideoCompositor.VideoCompositor => ({
    composite: (layers, options) =>
      Effect.gen(function* () {
        const renderingContext = yield* CanvasRenderingContext;
        const context = yield* renderingContext.make(options.size, { colorSpace: options.colorSpace });

        yield* compositeLayers(renderingContext, context, layers, options);

        return yield* Effect.try({
          try: () => renderingContext.snapshot(context, options.size),
          catch: toCompositeError,
        });
      }).pipe(Effect.mapError(toCompositeError), Effect.provide(CanvasRenderingContext.layer)),
  });

  /** Layer that provides the default canvas-backed `VideoCompositor`. */
  export const layer = Layer.succeed(VideoCompositor, make());

  const compositeLayers = (
    renderingContext: CanvasRenderingContext.CanvasRenderingContext,
    context: CanvasRenderingContext2D,
    layers: readonly VideoClip.Bitmap[],
    options: VideoCompositor.VideoCompositeOptions,
  ): Effect.Effect<void, CanvasRenderingContext.Error | VideoCompositor.Error> =>
    Effect.gen(function* () {
      const layerContext = yield* renderingContext.make(options.size, { colorSpace: options.colorSpace });

      yield* Effect.try({
        try: () => {
          for (const layer of layers) {
            const image = VideoClip.Bitmap.toImageData(layer, options.size, options.colorSpace) as ImageData;
            layerContext.putImageData(image, 0, 0);
            context.drawImage(layerContext.canvas, 0, 0);
          }
        },
        catch: toCompositeError,
      });
    });

  const toCompositeError = (cause: unknown): VideoCompositor.Error =>
    cause instanceof VideoCompositor.Error
      ? cause
      : new VideoCompositor.Error({
          cause,
          reason: new VideoCompositor.Error.CompositeFailed(),
        });
}
