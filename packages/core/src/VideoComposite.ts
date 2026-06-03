import { Array, Effect, Option, Stream } from "effect";

import { VideoClip } from "./VideoClip";
import { VideoCompositor } from "./VideoCompositor";
import { VideoContext } from "./VideoContext";

export namespace VideoComposite {
  export interface VideoComposite<I, IE = never, IR = never, OE = never, OR = never> extends VideoClip.VideoClip<
    I,
    IE,
    IR,
    OE,
    OR
  > {}

  export const make = <I, IE = never, IR = never, OE = never, OR = never>([head, ...tail]: readonly VideoClip.VideoClip<
    I,
    IE,
    IR,
    OE,
    OR
  >[]): Effect.Effect<VideoComposite<I, IE, IR, OE | VideoCompositor.Error, OR>, never, VideoContext> =>
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
          const { composite } = yield* Effect.serviceOption(VideoCompositor).pipe(
            Effect.map(Option.getOrElse(() => VideoCompositor.service)),
          );

          return yield* composite(frames, {
            colorSpace,
            size,
          });
        }),
      );
    });
}
