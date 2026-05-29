import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { Size } from "./Base";
import type { VideoClip } from "./VideoClip";
import type { VideoColorSpace } from "./VideoColorSpace";

export class VideoCompositor extends Context.Service<VideoCompositor, VideoCompositor.VideoCompositor>()(
  "@veya/core/VideoCompositor",
) {}

export namespace VideoCompositor {
  export interface VideoCompositor {
    readonly composite: (
      layers: readonly VideoClip.Bitmap[],
      options: VideoCompositeOptions,
    ) => Effect.Effect<VideoClip.Bitmap, Error>;
  }

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.CompositeFailed;
  }> {}
  export namespace Error {
    export class CompositeFailed extends Data.TaggedError("CompositeFailed")<{}> {}
  }

  export interface VideoCompositeOptions {
    /** Output frame size in pixels. */
    readonly size: Size;
    /** Output color space for the composed frame. */
    readonly colorSpace: VideoColorSpace.VideoColorSpace;
  }
}
