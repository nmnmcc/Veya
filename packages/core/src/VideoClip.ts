import { Stream } from "effect";
import type { Bitmap } from "./media";

export namespace VideoClip {
  export interface VideoClip<E = never, R = never> extends Stream.Stream<Bitmap, E, R> {}

  export type Any = VideoClip<any, any>;
}
