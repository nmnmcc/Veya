import { Context, Data } from "effect";

import type { VideoClip } from "@veya/core";

export class VideoResampler extends Context.Service<VideoResampler, VideoResampler.VideoResampler>()(
  "@veya/video/VideoResampler",
) {}

export namespace VideoResampler {
  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.ResampleFailed;
  }> {}
  export namespace Error {
    export class ResampleFailed extends Data.TaggedError("ResampleFailed")<{}> {}
  }

  export interface Options {
    readonly source: number;
    readonly target: number;
  }

  export interface VideoResampler {
    readonly resample: <E = never, R = never>(
      frames: VideoClip.VideoClip<E, R>,
      options: Options,
    ) => VideoClip.VideoClip<E | Error, R>;
  }
}
