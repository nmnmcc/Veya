import { Context, Data } from "effect";
import type { Effect } from "effect";
import type { Bitmap, Size } from "@veya/core";
import { ImageProbe } from "./ImageProbe";

export class ImageSource extends Context.Service<ImageSource, ImageSource.Service>()(
  "@veya/source-image/ImageSource",
) {}

export namespace ImageSource {
  export type MediaSource<E = never, R = never> = ImageProbe.MediaSource<E, R>;

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
