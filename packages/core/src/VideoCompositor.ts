import { Context, Data, Effect, Iterable, Layer } from "effect";

import type { Size } from "./Base";
import { VideoColor } from "./VideoColor";
import { VideoFrame } from "./VideoFrame";

export class VideoCompositor extends Context.Service<VideoCompositor, VideoCompositor.VideoCompositor>()(
  "@veya/core/VideoCompositor",
) {}

export namespace VideoCompositor {
  export interface VideoCompositor {
    readonly composite: (layers: readonly VideoFrame[], options: Options) => Effect.Effect<VideoFrame, Error>;
  }

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.CompositeFailed;
  }> {}
  export namespace Error {
    export class CompositeFailed extends Data.TaggedError("CompositeFailed")<{}> {}
  }

  export interface Options {
    /** Output frame size in pixels. */
    readonly size: Size;
    /** Output color space for the composed frame. */
    readonly colorSpace: VideoColor.ColorSpace;
  }

  export const service = VideoCompositor.of({
    composite: (layers, options) =>
      Effect.try({
        try: () =>
          Iterable.reduce(layers, VideoFrame.make(options.size), compositeLayer),
        catch: toCompositeError,
      }),
  });

  export const layer = Layer.succeed(VideoCompositor, service);

  const compositeLayer = (target: VideoFrame, layer: VideoFrame): VideoFrame =>
    Iterable.reduce(pixelOffsets(target), target, (target, index) => {
      const blended = VideoColor.blend(
        VideoColor.rgba(layer[index + 0] ?? 0, layer[index + 1] ?? 0, layer[index + 2] ?? 0, layer[index + 3] ?? 0),
        VideoColor.rgba(
          target[index + 0] ?? 0,
          target[index + 1] ?? 0,
          target[index + 2] ?? 0,
          target[index + 3] ?? 0,
        ),
      );

      target[index + 0] = blended[0];
      target[index + 1] = blended[1];
      target[index + 2] = blended[2];
      target[index + 3] = blended[3];

      return target;
    });

  const pixelOffsets = (frame: VideoFrame): Iterable<number> => {
    const pixels = frame.length / 4;

    return pixels === 0 ? Iterable.empty() : Iterable.makeBy((pixel) => pixel * 4, { length: pixels });
  };

  const toCompositeError = (cause: unknown): Error =>
    cause instanceof Error
      ? cause
      : new Error({
          cause,
          reason: new Error.CompositeFailed(),
        });
}
