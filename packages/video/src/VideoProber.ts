import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { VideoDecoder } from "./VideoDecoder";
import type { VideoMetadata } from "./VideoMetadata";

/** Effect service for reading video metadata without decoding every frame. */
export class VideoProber extends Context.Service<VideoProber, VideoProber.VideoProber>()("@veya/video/VideoProber") {}

export namespace VideoProber {
  /** Error raised when a video prober implementation cannot inspect a source. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the probe failure. */
    readonly reason: Error.ProbeFailed;
  }> {}
  export namespace Error {
    /** Indicates that metadata probing failed. */
    export class ProbeFailed extends Data.TaggedError("ProbeFailed")<{}> {}
  }

  /** Service contract for custom video metadata probers. */
  export interface VideoProber {
    /** Reads metadata from a video media source. */
    readonly probe: <SourceE = never, SourceR = never>(
      source: VideoDecoder.MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<VideoMetadata.VideoMetadata, SourceE | Error, SourceR>;
  }
}
