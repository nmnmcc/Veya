import { Context } from "effect";

import type { Size } from "./Base";
import type { VideoColor } from "./VideoColor";

export class VideoContext extends Context.Service<VideoContext, VideoContext.VideoContext>()(
  "@veya/core/VideoContext",
) {}

export namespace VideoContext {
  export interface VideoContext {
    /** Output frame size in pixels. */
    readonly size: Size;
    /** Output frame rate in frames per second. */
    readonly framerate: number;
    /** Output color space. */
    readonly colorSpace: VideoColor.ColorSpace;
  }
}
