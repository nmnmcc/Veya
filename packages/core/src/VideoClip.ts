import { Effect, Stream } from "effect";
import { Effectable } from "./Effectable";
import type { Bitmap } from "./media";

export namespace VideoClip {
  export interface VideoClip<E = never, R = never> {
    readonly render: Render<E, R>;
  }

  export type Render<E, R> = Stream.Stream<Bitmap, E, R>;

  export const make = <ClipE = never, ClipR = never, E = never, R = never>(
    element: Effectable<VideoClip<ClipE, ClipR>, E, R>,
  ): VideoClip<ClipE | E, ClipR | R> => ({
    render: Stream.unwrap(Effect.map(Effectable.resolve(element), (element) => element.render)),
  });
}
