import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";

import type { Size, VideoClip } from "@veya/core";

export class ImageDecoder extends Context.Service<ImageDecoder, ImageDecoder.ImageDecoder>()(
  "@veya/image/ImageDecoder",
) {}

export namespace ImageDecoder {
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class ImageDecoderError extends Data.TaggedError("ImageDecoderError")<{
    readonly reason?: unknown;
  }> {}

  export interface DecodeOptions {
    readonly size?: Size;
  }

  export interface ImageDecoder {
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: DecodeOptions,
    ) => Effect.Effect<VideoClip.Bitmap, SourceE | ImageDecoderError, SourceR>;
  }
}
