import { Context } from "effect";

import type { Size, VideoColorSpace } from "@veya/core";

/** Effect service that exposes metadata for the current video source. */
export class VideoMetadata extends Context.Service<VideoMetadata, VideoMetadata.VideoMetadata>()(
  "@veya/video/VideoMetadata",
) {}

export namespace VideoMetadata {
  /** Metadata discovered by a `VideoProber`. */
  export interface VideoMetadata {
    /** Source frame size in pixels. */
    readonly size?: Size;
    /** Source frame rate in frames per second. */
    readonly framerate?: number;
    /** Number of frames in the source. */
    readonly frames?: number;
    /** Source duration in seconds. */
    readonly duration?: number;
    /** Source color space, when known. */
    readonly colorSpace?: VideoColorSpace.VideoColorSpace;
  }
}
