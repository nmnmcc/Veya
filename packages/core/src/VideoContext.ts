import { Context } from "effect";

import type { Size } from "./Size";

export class VideoContext extends Context.Service<VideoContext, VideoContext.CompositeVideoContext>()(
  "@veya/core/CompositeVideoContext",
) {}

export namespace VideoContext {
  export interface CompositeVideoContext {
    readonly size: Size;
    readonly framerate: number;
  }
}
