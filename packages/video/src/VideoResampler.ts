import { Context, Data } from "effect";

import type { VideoClip, VideoTick } from "@veya/core";

/** Effect service for adapting a video clip from one framerate to another. */
export class VideoResampler extends Context.Service<VideoResampler, VideoResampler.VideoResampler>()(
  "@veya/video/VideoResampler",
) {}

export namespace VideoResampler {
  /** Error raised when video frame resampling fails. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the resampling failure. */
    readonly reason: Error.ResampleFailed;
  }> {}
  export namespace Error {
    /** Indicates that frame resampling failed. */
    export class ResampleFailed extends Data.TaggedError("ResampleFailed")<{}> {}
  }

  /** Source and target framerates for a resampling operation. */
  export interface Options {
    /** Source frame rate in frames per second. */
    readonly source: number;
    /** Target frame rate in frames per second. */
    readonly target: number;
  }

  /** Service contract for custom video resampler implementations. */
  export interface VideoResampler {
    /** Resamples a video clip to the requested target framerate. */
    readonly resample: <I = VideoTick, IE = never, IR = never, OE = never, OR = never>(
      frames: VideoClip.VideoClip<I, IE, IR, OE, OR>,
      options: Options,
    ) => VideoClip.VideoClip<I, IE, IR, OE | Error, OR>;
  }
}
