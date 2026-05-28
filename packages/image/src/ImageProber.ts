import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";

import type { Size } from "@veya/core";

/** Effect service for reading image metadata without decoding pixels. */
export class ImageProber extends Context.Service<ImageProber, ImageProber.ImageProber>()("@veya/image/ImageProber") {}

export namespace ImageProber {
  /** Image input as a byte array or a stream of byte chunks. */
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  /** Error raised when an image prober implementation cannot inspect a source. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the probe failure. */
    readonly reason: Error.ProbeFailed;
  }> {}
  export namespace Error {
    /** Indicates that metadata probing failed. */
    export class ProbeFailed extends Data.TaggedError("ProbeFailed")<{}> {}
  }

  /** Metadata discovered by an `ImageProber`. */
  export interface Metadata {
    /** Image size in pixels. */
    readonly size?: Size;
  }

  /** Service contract for custom image metadata probers. */
  export interface ImageProber {
    /** Reads metadata from an image media source. */
    readonly probe: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<Metadata, SourceE | Error, SourceR>;
  }
}
