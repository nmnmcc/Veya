import { Context, Data, Effect, Layer } from "effect";

import { type Size, VideoClip, VideoColor } from "@veya/core";

export class CanvasRenderingContext extends Context.Service<
  CanvasRenderingContext,
  CanvasRenderingContext.CanvasRenderingContext
>()("@veya/canvas/CanvasRenderingContext") {
  public static readonly layer = Layer.sync(CanvasRenderingContext, () =>
    CanvasRenderingContext.of({
      make: (size, options) =>
        Effect.gen(function* () {
          const OffscreenCanvas = globalThis.OffscreenCanvas;

          if (typeof OffscreenCanvas !== "function") {
            return yield* new CanvasRenderingContext.Error({
              reason: new CanvasRenderingContext.Error.OffscreenCanvasNotSupported(),
            });
          }

          const context = new OffscreenCanvas(...size).getContext("2d", options);

          if (context === null)
            return yield* new CanvasRenderingContext.Error({
              reason: new CanvasRenderingContext.Error.ContextCreationFailed(),
            });

          return context;
        }),
      snapshot: (context, size: Size, options = {}) => {
        const settings: ImageDataSettings = {
          ...(options.colorSpace === undefined ? {} : { colorSpace: options.colorSpace }),
        };
        const image = context.getImageData(0, 0, ...size, settings);

        return VideoClip.Bitmap.fromImageData(image);
      },
    }),
  );
}

/** Canvas 2D context type accepted by Veya in browser and worker runtimes. */
export type CanvasRenderingContext2D = globalThis.CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export namespace CanvasRenderingContext {
  export interface CanvasRenderingContext {
    readonly make: (
      size: Size,
      options?: CanvasRenderingContext2DSettings,
    ) => Effect.Effect<CanvasRenderingContext2D, Error>;
    readonly snapshot: (
      context: CanvasRenderingContext2D,
      size: Size,
      options?: SnapshotOptions,
    ) => VideoClip.Bitmap;
  }

  export interface SnapshotOptions {
    readonly colorSpace?: VideoColor.ColorSpace | undefined;
  }

  /** Effect service that exposes the current 2D context while a draw callback runs. */
  export class Context2D extends Context.Service<Context2D, CanvasRenderingContext2D>()(
    "@veya/canvas/CanvasRenderingContext/Context2D",
  ) {}

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.OffscreenCanvasNotSupported | Error.ContextCreationFailed;
  }> {}
  export namespace Error {
    /** Indicates that the runtime does not provide `OffscreenCanvas`. */
    export class OffscreenCanvasNotSupported extends Data.TaggedError("OffscreenCanvasNotSupported")<{}> {}
    /** Indicates that a 2D canvas context could not be created. */
    export class ContextCreationFailed extends Data.TaggedError("ContextCreationFailed")<{}> {}
  }
}
