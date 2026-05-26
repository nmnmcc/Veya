import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { Size } from "./Size";
import type { VideoClip } from "./VideoClip";

export class VideoCompositor extends Context.Service<VideoCompositor, VideoCompositor.VideoCompositor>()(
  "@veya/core/VideoCompositor",
) {}

export namespace VideoCompositor {
  export class VideoCompositorError extends Data.TaggedError("VideoCompositorError")<{}> {}

  export interface VideoCompositeOptions {
    readonly size: Size;
  }

  export interface VideoCompositor {
    readonly composite: (
      frames: readonly VideoClip.Bitmap[],
      options: VideoCompositeOptions,
    ) => Effect.Effect<VideoClip.Bitmap, VideoCompositorError>;
  }
}
