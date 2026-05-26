import { Context } from "effect";

import type { Size } from "./media";

export class CompositeVideoContext extends Context.Service<
  CompositeVideoContext,
  CompositeVideoContext.CompositeVideoContext
>()("@veya/core/CompositeVideoContext") {}

export namespace CompositeVideoContext {
  export interface CompositeVideoContext {
    readonly size: Size;
    readonly framerate: number;
  }
}
