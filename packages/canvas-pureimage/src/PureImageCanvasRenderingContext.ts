import { Effect, Layer } from "effect";
import * as PureImage from "pureimage";

import { CanvasRenderingContext, type CanvasRenderingContext2D } from "@veya/canvas";
import type { VideoFrame } from "@veya/core";

export namespace PureImageCanvasRenderingContext {
  export const make = Effect.sync(() => {
    const bitmaps = new WeakMap<object, PureImageBitmap>();

    return CanvasRenderingContext.of({
      make: ([width, height], _options) =>
        Effect.try({
          try: () => {
            const bitmap = PureImage.make(width, height) as PureImageBitmap;
            const context = bitmap.getContext("2d") as CanvasRenderingContext2D;

            bitmaps.set(context as object, bitmap);

            return context;
          },
          catch: toContextCreationFailed,
        }),
      snapshot: (context, [width, height]) => {
        const bitmap = bitmaps.get(context as object);

        if (bitmap === undefined) {
          throw new Error("PureImage context was not created by @veya/canvas-pureimage.");
        }
        if (bitmap.width !== width || bitmap.height !== height) {
          throw new Error("PureImage snapshot size does not match the backing bitmap.");
        }

        return new Uint8ClampedArray(bitmap.data) as VideoFrame;
      },
    });
  });

  export const layer = Layer.effect(CanvasRenderingContext, make);

  interface PureImageBitmap {
    readonly data: Uint8Array | Uint8ClampedArray;
    readonly height: number;
    readonly width: number;
    readonly getContext: (type: "2d") => unknown;
  }

  const toContextCreationFailed = (cause: unknown): CanvasRenderingContext.Error =>
    new CanvasRenderingContext.Error({
      cause,
      reason: new CanvasRenderingContext.Error.ContextCreationFailed(),
    });
}
