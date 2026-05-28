import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";

import type { Size } from "@veya/core";

export class ImageProber extends Context.Service<ImageProber, ImageProber.ImageProber>()("@veya/image/ImageProber") {}

export namespace ImageProber {
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.ProbeFailed;
  }> {}
  export namespace Error {
    export class ProbeFailed extends Data.TaggedError("ProbeFailed")<{}> {}
  }

  export interface Metadata {
    readonly size?: Size;
  }

  export interface ImageProber {
    readonly probe: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<Metadata, SourceE | Error, SourceR>;
  }
}
