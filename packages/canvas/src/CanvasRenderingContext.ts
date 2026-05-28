import { Context, Data, Effect, Layer } from "effect";

import { type Size, VideoClip } from "@veya/core";

/** Effect service for creating canvas 2D contexts and reading frames back as bitmaps. */
export class CanvasRenderingContext extends Context.Service<
  CanvasRenderingContext,
  CanvasRenderingContext.CanvasRenderingContext
>()("@veya/canvas/CanvasRenderingContext") {
  /** Layer that provides an `OffscreenCanvas`-based rendering context implementation. */
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
      snapshot: (context, size: Size) => {
        return VideoClip.Bitmap.fromImageData(context.getImageData(0, 0, ...size));
      },
    }),
  );
}

/** Canvas 2D context type accepted by Veya in browser and worker runtimes. */
export type CanvasRenderingContext2D = globalThis.CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export namespace CanvasRenderingContext {
  /** Effect service that exposes the current 2D context while a draw callback runs. */
  export class Context2D extends Context.Service<Context2D, CanvasRenderingContext2D>()(
    "@veya/canvas/CanvasRenderingContext/Context2D",
  ) {}

  /** Service contract for canvas context creation and bitmap snapshots. */
  export interface CanvasRenderingContext {
    /** Creates a canvas 2D context with the requested pixel size. */
    readonly make: (
      size: Size,
      options?: CanvasRenderingContext2DSettings,
    ) => Effect.Effect<CanvasRenderingContext2D, Error>;
    /** Reads the current canvas pixels into a Veya bitmap. */
    readonly snapshot: (context: CanvasRenderingContext2D, size: Size) => VideoClip.Bitmap;
  }

  /** Error raised when a canvas rendering context cannot be created. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the canvas setup failure. */
    readonly reason: Error.OffscreenCanvasNotSupported | Error.ContextCreationFailed;
  }> {}
  export namespace Error {
    /** Indicates that the runtime does not provide `OffscreenCanvas`. */
    export class OffscreenCanvasNotSupported extends Data.TaggedError("OffscreenCanvasNotSupported")<{}> {}
    /** Indicates that a 2D canvas context could not be created. */
    export class ContextCreationFailed extends Data.TaggedError("ContextCreationFailed")<{}> {}
  }
}
