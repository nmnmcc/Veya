import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { Size } from "./Size";
import type { VideoClip } from "./VideoClip";
import type { VideoColorSpace } from "./VideoColorSpace";

export class VideoCompositor extends Context.Service<VideoCompositor, VideoCompositor.VideoCompositor>()(
  "@veya/core/VideoCompositor",
) {}

export namespace VideoCompositor {
  export class VideoCompositorError extends Data.TaggedError("VideoCompositorError")<{}> {}

  export interface VideoCompositeOptions {
    readonly size: Size;
    readonly colorSpace: VideoColorSpace.VideoColorSpace;
  }

  export interface VideoCompositor {
    readonly composite: (
      layers: readonly VideoClip.Bitmap[],
      options: VideoCompositeOptions,
    ) => Effect.Effect<VideoClip.Bitmap, VideoCompositorError>;
  }
}
