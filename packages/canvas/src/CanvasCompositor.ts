import { Effect, Layer } from "effect";

import { VideoClip, VideoCompositor } from "@veya/core";

import { CanvasRenderingContext } from "./CanvasRenderingContext";

export namespace CanvasCompositor {
  export const make = Effect.fn(function* () {
    const { make, snapshot } = yield* CanvasRenderingContext;

    return VideoCompositor.of({
      composite: (layers, options) =>
        Effect.gen(function* () {
          const context = yield* make(options.size, { colorSpace: options.colorSpace });

          for (const layer of layers) {
            const layerCanvasContext = yield* make(options.size, { colorSpace: options.colorSpace });

            yield* Effect.try({
              try: () => {
                const image = VideoClip.Bitmap.toImageData(layer, options.size, options.colorSpace);
                layerCanvasContext.putImageData(image, 0, 0);
                context.drawImage(layerCanvasContext.canvas, 0, 0);
              },
              catch: toCompositeError,
            });
          }

          return yield* Effect.try({
            try: () => snapshot(context, options.size),
            catch: toCompositeError,
          });
        }).pipe(Effect.mapError(toCompositeError)),
    });
  });

  export const layer = Layer.effect(VideoCompositor, make());

  const toCompositeError = (cause: unknown): VideoCompositor.Error =>
    cause instanceof VideoCompositor.Error
      ? cause
      : new VideoCompositor.Error({
          cause,
          reason: new VideoCompositor.Error.CompositeFailed(),
        });
}
