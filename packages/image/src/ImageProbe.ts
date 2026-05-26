import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";

import type { Size } from "@veya/core";

export class ImageProbe extends Context.Service<
  ImageProbe,
  {
    readonly probe: <SourceE = never, SourceR = never>(
      source: ImageProbe.MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<ImageProbe.Metadata, SourceE | ImageProbe.ImageProbeError, SourceR>;
  }
>()("@veya/image/ImageProbe") {}

export namespace ImageProbe {
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class ImageProbeError extends Data.TaggedError("ImageProbeError")<{
    readonly reason?: unknown;
  }> {}

  export interface Metadata {
    readonly size?: Size;
  }
}
