import { Context } from "effect";

import type { Size } from "./Base";
import type { VideoColorSpace } from "./VideoColorSpace";

/** Effect service that provides the video settings for rendering. */
export class VideoContext extends Context.Service<VideoContext, VideoContext.VideoContext>()(
  "@veya/core/VideoContext",
) {}

export namespace VideoContext {
  /** Video render settings shared by clips, gaps, and compositors. */
  export interface VideoContext {
    /** Output frame size in pixels. */
    readonly size: Size;
    /** Output frame rate in frames per second. */
    readonly framerate: number;
    /** Output color space. Defaults to `srgb` when omitted. */
    readonly colorSpace?: VideoColorSpace.VideoColorSpace;
  }
}
