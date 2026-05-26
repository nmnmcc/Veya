import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { VideoMetadata } from "./VideoMetadata";
import type { VideoSource } from "./VideoSource";

export class VideoProbe extends Context.Service<
  VideoProbe,
  {
    readonly probe: <SourceE = never, SourceR = never>(
      source: VideoSource.MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<VideoMetadata.VideoMetadata, SourceE | VideoProbe.VideoProbeError, SourceR>;
  }
>()("@veya/video/VideoProbe") {}

export namespace VideoProbe {
  export class VideoProbeError extends Data.TaggedError("VideoProbeError")<{
    readonly reason?: unknown;
  }> {}
}
