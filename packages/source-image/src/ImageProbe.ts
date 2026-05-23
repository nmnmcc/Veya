import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";
import type { Size } from "@veya/core";

export namespace ImageProbe {
  export type MediaSource<E = never, R = never> = string | URL | Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class ImageProbeError extends Data.TaggedError("ImageProbeError")<{
    readonly reason?: unknown;
  }> {}

  export interface Metadata {
    readonly size?: Size;
  }

  export interface ImageProbe {
    readonly probe: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<Metadata, SourceE | ImageProbeError, SourceR>;
  }

  export class Service extends Context.Service<Service, ImageProbe>()("@veya/source-image/ImageProbe/Service") {}
}
