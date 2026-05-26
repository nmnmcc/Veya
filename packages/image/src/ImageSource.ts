import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";

import type { Bitmap, Size } from "@veya/core";

export class ImageSource extends Context.Service<ImageSource, ImageSource.Service>()("@veya/image/ImageSource") {}

export namespace ImageSource {
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class ImageSourceError extends Data.TaggedError("ImageSourceError")<{
    readonly reason?: unknown;
  }> {}

  export interface DecodeOptions {
    readonly size?: Size;
  }

  export interface Service {
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: DecodeOptions,
    ) => Effect.Effect<Bitmap, SourceE | ImageSourceError, SourceR>;
  }
}
