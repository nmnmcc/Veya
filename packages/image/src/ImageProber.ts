import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";

import type { Size } from "@veya/core";

export class ImageProber extends Context.Service<ImageProber, ImageProber.ImageProber>()("@veya/image/ImageProber") {}

export namespace ImageProber {
  export interface ImageProber {
    readonly probe: <E = never, R = never>(source: MediaSource<E, R>) => Effect.Effect<Metadata, E | Error, R>;
  }

  /** Image input as a byte array or a stream of byte chunks. */
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.ProbeFailed;
  }> {}
  export namespace Error {
    export class ProbeFailed extends Data.TaggedError("ProbeFailed")<{}> {}
  }

  export interface Metadata {
    /** Image size in pixels. */
    readonly size?: Size;
  }
}
