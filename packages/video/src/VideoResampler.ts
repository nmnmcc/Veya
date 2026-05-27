import { Context, Data } from "effect";

import type { VideoClip } from "@veya/core";

export class VideoResampler extends Context.Service<VideoResampler, VideoResampler.VideoResampler>()(
  "@veya/video/VideoResampler",
) {}

export namespace VideoResampler {
  export class VideoResamplerError extends Data.TaggedError("VideoResamplerError")<{
    readonly reason?: unknown;
  }> {}

  export interface Options {
    readonly source: number;
    readonly target: number;
  }

  export interface VideoResampler {
    readonly resample: <E = never, R = never>(
      frames: VideoClip.VideoClip<E, R>,
      options: Options,
    ) => VideoClip.VideoClip<E | VideoResamplerError, R>;
  }
}
