import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { VideoDecoder } from "./VideoDecoder";
import type { VideoMetadata } from "./VideoMetadata";

export class VideoProber extends Context.Service<VideoProber, VideoProber.VideoProber>()("@veya/video/VideoProber") {}

export namespace VideoProber {
  export class VideoProberError extends Data.TaggedError("VideoProberError")<{
    readonly reason?: unknown;
  }> {}

  export interface VideoProber {
    readonly probe: <SourceE = never, SourceR = never>(
      source: VideoDecoder.MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<VideoMetadata.VideoMetadata, SourceE | VideoProberError, SourceR>;
  }
}
