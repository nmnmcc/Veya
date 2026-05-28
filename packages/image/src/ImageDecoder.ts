import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";

import type { Size, VideoClip } from "@veya/core";

/** Effect service for turning image bytes into a bitmap frame. */
export class ImageDecoder extends Context.Service<ImageDecoder, ImageDecoder.ImageDecoder>()(
  "@veya/image/ImageDecoder",
) {}

export namespace ImageDecoder {
  /** Image input as a byte array or a stream of byte chunks. */
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  /** Error raised when an image decoder implementation cannot decode a source. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the decode failure. */
    readonly reason: Error.DecodeFailed;
  }> {}
  export namespace Error {
    /** Indicates that decoding failed. */
    export class DecodeFailed extends Data.TaggedError("DecodeFailed")<{}> {}
  }

  /** Resolved options passed to an image decoder implementation. */
  export interface DecodeOptions {
    /** Output frame size in pixels. */
    readonly size?: Size | undefined;
  }

  /** Service contract for custom image decoder implementations. */
  export interface ImageDecoder {
    /** Decodes an image source into a bitmap frame. */
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: DecodeOptions,
    ) => Effect.Effect<VideoClip.Bitmap, SourceE | Error, SourceR>;
  }
}
