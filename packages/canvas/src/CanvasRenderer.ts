import { Context, Data, Effect, Layer } from "effect";

import type { Size, VideoClip, VideoColorSpace } from "@veya/core";

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
    readonly colorSpace: VideoColorSpace.VideoColorSpace;
  }

  export type Draw<E = never, R = never> = (context: RenderingContext2D, frame: Frame) => Effect.Effect<void, E, R>;

  export class CanvasRendererError extends Data.TaggedError("CanvasRendererError")<{
    readonly reason?: unknown;
  }> {}

  export interface CanvasRenderer {
    readonly render: <E = never, R = never>(
      draw: Draw<E, R>,
      frame: Frame,
    ) => Effect.Effect<VideoClip.Bitmap, E | CanvasRendererError, R>;
  }

  export const make = (): CanvasRenderer => ({
    render: (draw, frame) =>
      Effect.gen(function* () {
        const context = yield* makeContext(frame.size, frame.colorSpace);
        const drawing = yield* Effect.try({
          try: () => draw(context, frame),
          catch: (reason) => new CanvasRendererError({ reason }),
        });

        yield* drawing;

        const image = yield* getImageData(context, frame.size, frame.colorSpace);

        return yield* imageDataToBitmap(image, frame.size, frame.colorSpace);
      }),
  });

  export const layer = Layer.succeed(CanvasRenderer, make());

  const makeContext = (
    [width, height]: Size,
    colorSpace: VideoColorSpace.VideoColorSpace,
  ): Effect.Effect<RenderingContext2D, CanvasRendererError> =>
    Effect.try({
      try: () => {
        if (typeof OffscreenCanvas === "undefined") {
          throw new Error("OffscreenCanvas is not available in this runtime");
        }

        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext("2d", { colorSpace: toCanvasColorSpace(colorSpace) });

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
    colorSpace: VideoColorSpace.VideoColorSpace,
  ): Effect.Effect<ImageData, CanvasRendererError> =>
    Effect.try({
      try: () => context.getImageData(0, 0, width, height, { colorSpace: toCanvasColorSpace(colorSpace) }),
      catch: (reason) => new CanvasRendererError({ reason }),
    });

  const imageDataToBitmap = (
    { data }: ImageData,
    [width, height]: Size,
    colorSpace: VideoColorSpace.VideoColorSpace,
  ): Effect.Effect<VideoClip.Bitmap, CanvasRendererError> =>
    Effect.try({
      try: () => {
        const expectedBytes = width * height * 4;
        if (data.length < expectedBytes) {
          throw new Error(`canvas returned ${data.length} RGBA bytes for a ${width}x${height} image`);
        }

        let offset = 0;
        const mapChannel = isLinearColorSpace(colorSpace) ? encodedChannelToLinearChannel : identityChannel;

        return globalThis.Array.from({ length: height }, () =>
          globalThis.Array.from({ length: width }, () => {
            const pixel = [
              mapChannel(readImageDataChannel(data, offset)),
              mapChannel(readImageDataChannel(data, offset + 1)),
              mapChannel(readImageDataChannel(data, offset + 2)),
              readImageDataChannel(data, offset + 3),
            ] as const;
            offset += 4;

            return pixel;
          }),
        );
      },
      catch: (reason) => new CanvasRendererError({ reason }),
    });

  const toCanvasColorSpace = (colorSpace: VideoColorSpace.VideoColorSpace): PredefinedColorSpace => {
    switch (colorSpace) {
      case "display-p3":
      case "display-p3-linear":
        return "display-p3";
      case "srgb":
      case "srgb-linear":
        return "srgb";
    }
  };

  const isLinearColorSpace = (colorSpace: VideoColorSpace.VideoColorSpace): boolean => {
    return colorSpace === "srgb-linear" || colorSpace === "display-p3-linear";
  };

  const identityChannel = (value: number): number => value;

  const readImageDataChannel = (data: Uint8ClampedArray, offset: number): number => {
    const value = data[offset];

    if (value === undefined) {
      throw new Error(`canvas image data is missing byte ${offset}`);
    }

    return value;
  };

  const encodedChannelToLinearChannel = (value: number): number => {
    const encoded = value / 255;
    const linear = encoded <= 0.04045 ? encoded / 12.92 : ((encoded + 0.055) / 1.055) ** 2.4;

    return Math.round(linear * 255);
  };
}
