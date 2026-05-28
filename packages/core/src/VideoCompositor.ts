import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { Size } from "./Base";
import type { VideoClip } from "./VideoClip";
import type { VideoColorSpace } from "./VideoColorSpace";

/** Effect service used by `VideoComposite` to layer video frames. */
export class VideoCompositor extends Context.Service<VideoCompositor, VideoCompositor.VideoCompositor>()(
  "@veya/core/VideoCompositor",
) {}

export namespace VideoCompositor {
  /** Error raised when a compositor implementation cannot combine layers. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the compositor failure. */
    readonly reason: Error.CompositeFailed;
  }> {}
  export namespace Error {
    /** Indicates that a video composite operation failed. */
    export class CompositeFailed extends Data.TaggedError("CompositeFailed")<{}> {}
  }

  /** Output settings passed to a video compositor implementation. */
  export interface VideoCompositeOptions {
    /** Output frame size in pixels. */
    readonly size: Size;
    /** Output color space for the composed frame. */
    readonly colorSpace: VideoColorSpace.VideoColorSpace;
  }

  /** Service contract for custom video compositor implementations. */
  export interface VideoCompositor {
    /** Combines ordered bitmap layers into one output bitmap. */
    readonly composite: (
      layers: readonly VideoClip.Bitmap[],
      options: VideoCompositeOptions,
    ) => Effect.Effect<VideoClip.Bitmap, Error>;
  }
}
