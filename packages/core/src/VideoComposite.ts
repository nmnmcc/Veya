import { Array, Effect, Stream } from "effect";

import { VideoClip } from "./VideoClip";
import { VideoCompositor } from "./VideoCompositor";
import { VideoContext } from "./VideoContext";
import type { VideoTrack } from "./VideoTrack";

export namespace VideoComposite {
  export interface VideoComposite<I, IE = never, IR = never, OE = never, OR = never> extends VideoClip.VideoClip<
    I,
    IE,
    IR,
    OE,
    OR
  > {}

  export const make = <I, IE = never, IR = never, OE = never, OR = never>([
    head,
    ...tail
  ]: readonly VideoTrack.VideoTrack<I, IE, IR, OE, OR>[]): Effect.Effect<
    VideoComposite<I, IE, IR, OE | VideoCompositor.Error, OR | VideoCompositor>,
    never,
    VideoContext
  > =>
    VideoClip.make((stream) => {
      if (!head) return Stream.empty;

      const groups = Array.reduce(
        tail,
        Stream.map(head(stream), (frame) => [frame]),
        (frames, track) => Stream.zipWith(frames, track(stream), (frames, frame) => Array.append(frames, frame)),
      );

      return Stream.mapEffect(groups, (frames) =>
        Effect.gen(function* () {
          const { colorSpace, size } = yield* VideoContext;
          const { composite } = yield* VideoCompositor;

          return yield* composite(frames, {
            colorSpace,
            size,
          });
        }),
      );
    });
}
