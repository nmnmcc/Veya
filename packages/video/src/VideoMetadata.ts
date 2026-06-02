import { Context } from "effect";

import type { Size, VideoColor } from "@veya/core";

export class VideoMetadata extends Context.Service<VideoMetadata, VideoMetadata.VideoMetadata>()(
  "@veya/video/VideoMetadata",
) {}

export namespace VideoMetadata {
  export interface VideoMetadata {
    /** Source frame size in pixels. */
    readonly size?: Size;
    /** Source frame rate in frames per second. */
    readonly framerate?: number;
    /** Number of frames in the source. */
    readonly frames?: number;
    /** Source color space, when known. */
    readonly colorSpace?: VideoColor.ColorSpace;
  }
}
