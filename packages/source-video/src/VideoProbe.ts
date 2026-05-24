import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";
import type * as Duration from "effect/Duration";
import type { FrameCount, Size } from "@veya/core";

export class VideoProbe extends Context.Service<
  VideoProbe,
  {
    readonly probe: <SourceE = never, SourceR = never>(
      source: VideoProbe.MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<VideoProbe.Metadata, SourceE | VideoProbe.VideoProbeError, SourceR>;
  }
>()("@veya/source-video/VideoProbe") {}

export namespace VideoProbe {
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class VideoProbeError extends Data.TaggedError("VideoProbeError")<{
    readonly reason?: unknown;
  }> {}

  export interface Metadata {
    readonly size?: Size;
    readonly framerate?: number;
    readonly frames?: FrameCount;
    readonly duration?: Duration.Duration;
  }
}
