import { Context, Data, Effect } from "effect";

import type { VideoClip, VideoContext } from "@veya/core";

export class VideoResampler extends Context.Service<VideoResampler, VideoResampler.VideoResampler>()(
  "@veya/video/VideoResampler",
) {}

export namespace VideoResampler {
  export interface VideoResampler {
    readonly resample: <I, IE = never, IR = never, OE = never, OR = never>(
      clip: VideoClip.VideoClip<I, IE, IR, OE, OR>,
      options: Options,
    ) => Effect.Effect<VideoClip.VideoClip<I, IE, IR, OE | Error, OR>, never, VideoContext>;
  }

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.ResampleFailed;
  }> {}
  export namespace Error {
    export class ResampleFailed extends Data.TaggedError("ResampleFailed")<{}> {}
  }

  export interface Options {
    /** Source frame rate in frames per second. */
    readonly source: number;
    /** Target frame rate in frames per second. */
    readonly target: number;
  }
}
