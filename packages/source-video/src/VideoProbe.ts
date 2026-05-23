import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";
import type * as Duration from "effect/Duration";
import type { FrameCount, Size } from "@veya/core";

export namespace VideoProbe {
  export type MediaSource<E = never, R = never> = string | URL | Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class VideoProbeError extends Data.TaggedError("VideoProbeError")<{
    readonly reason?: unknown;
  }> {}

  export interface Metadata {
    readonly size?: Size;
    readonly framerate?: number;
    readonly frames?: FrameCount;
    readonly duration?: Duration.Duration;
  }

  export interface VideoProbe {
    readonly probe: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<Metadata, SourceE | VideoProbeError, SourceR>;
  }

  export class Service extends Context.Service<Service, VideoProbe>()("@veya/source-video/VideoProbe/Service") {}
}
