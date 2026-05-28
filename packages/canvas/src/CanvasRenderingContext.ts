import { Context, Data, Effect, Layer } from "effect";

import { type Size, VideoClip } from "@veya/core";

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
      snapshot: (context, size: Size) => {
        return VideoClip.Bitmap.fromImageData(context.getImageData(0, 0, ...size));
      },
    }),
  );
}

export type CanvasRenderingContext2D = globalThis.CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export namespace CanvasRenderingContext {
  export class Context2D extends Context.Service<Context2D, CanvasRenderingContext2D>()(
    "@veya/canvas/CanvasRenderingContext/Context2D",
  ) {}

  export interface CanvasRenderingContext {
    readonly make: (size: Size, options?: any) => Effect.Effect<CanvasRenderingContext2D, Error>;
    readonly snapshot: (context: CanvasRenderingContext2D, size: Size) => VideoClip.Bitmap;
  }

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.OffscreenCanvasNotSupported | Error.ContextCreationFailed;
  }> {}
  export namespace Error {
    export class OffscreenCanvasNotSupported extends Data.TaggedError("OffscreenCanvasNotSupported")<{}> {}
    export class ContextCreationFailed extends Data.TaggedError("ContextCreationFailed")<{}> {}
  }
}
