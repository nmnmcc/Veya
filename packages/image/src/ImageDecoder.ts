import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";

import type { Size, VideoFrame } from "@veya/core";

export class ImageDecoder extends Context.Service<ImageDecoder, ImageDecoder.ImageDecoder>()(
  "@veya/image/ImageDecoder",
) {}

export namespace ImageDecoder {
  export interface ImageDecoder {
    readonly decode: <E = never, R = never>(
      source: MediaSource<E, R>,
      options: DecodeOptions,
    ) => Effect.Effect<VideoFrame, E | Error, R>;
  }

  /** Image input as a byte array or a stream of byte chunks. */
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.DecodeFailed;
  }> {}
  export namespace Error {
    export class DecodeFailed extends Data.TaggedError("DecodeFailed")<{}> {}
  }

  export interface DecodeOptions {
    /** Output frame size in pixels. */
    readonly size?: Size | undefined;
  }
}
