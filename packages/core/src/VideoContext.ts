import { Context } from "effect";

import type { Size } from "./Size";

export class VideoContext extends Context.Service<VideoContext, VideoContext.VideoContext>()(
  "@veya/core/VideoContext",
) {}

export namespace VideoContext {
  export interface VideoContext {
    readonly size: Size;
    readonly framerate: number;
  }
}
