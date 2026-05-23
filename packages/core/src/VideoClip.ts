import { Stream } from "effect";
import type { Bitmap } from "./media";

export namespace VideoClip {
  export interface VideoClip<E = never, R = never> {
    readonly render: Render<E, R>;
  }

  export type Render<E, R> = Stream.Stream<Bitmap, E, R>;

  export const make = <E = never, R = never>(element: VideoClip<E, R>) => element;
}
