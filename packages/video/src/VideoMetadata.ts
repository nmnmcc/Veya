import { Context } from "effect";

import type { Size, VideoColorSpace } from "@veya/core";

export class VideoMetadata extends Context.Service<VideoMetadata, VideoMetadata.VideoMetadata>()(
  "@veya/video/VideoMetadata",
) {}

export namespace VideoMetadata {
  export interface VideoMetadata {
    readonly size?: Size;
    readonly framerate?: number;
    readonly frames?: number;
    readonly duration?: number;
    readonly colorSpace?: VideoColorSpace.VideoColorSpace;
  }
}
