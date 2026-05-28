import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { VideoDecoder } from "./VideoDecoder";
import type { VideoMetadata } from "./VideoMetadata";

export class VideoProber extends Context.Service<VideoProber, VideoProber.VideoProber>()("@veya/video/VideoProber") {}

export namespace VideoProber {
  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.ProbeFailed;
  }> {}
  export namespace Error {
    export class ProbeFailed extends Data.TaggedError("ProbeFailed")<{}> {}
  }

  export interface VideoProber {
    readonly probe: <SourceE = never, SourceR = never>(
      source: VideoDecoder.MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<VideoMetadata.VideoMetadata, SourceE | Error, SourceR>;
  }
}
