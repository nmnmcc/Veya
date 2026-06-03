import { Effect, Stream } from "effect";

import type { Clip } from "./Base";
import { Encodable } from "./Encodable";
import { VideoContext } from "./VideoContext";
import { VideoFrame } from "./VideoFrame";

export namespace VideoClip {
  export type VideoClip<I, IE = never, IR = never, OE = never, OR = never> = Clip<
    VideoContext.VideoContext,
    I,
    VideoFrame,
    IE,
    IR,
    OE,
    OR
  >;

  export type Encodable<E = never, R = never> = ReturnType<VideoClip<never, never, never, E, R>>;

  /** Creates a video clip from a stream transformer. */
  export const make = <I, IE = never, IR = never, OE = never, OR = never>(
    clip: (stream: Stream.Stream<I, IE, IR>) => Stream.Stream<VideoFrame, OE, OR>,
  ): Effect.Effect<VideoClip<I, IE, IR, OE, Exclude<OR, VideoContext>>, never, VideoContext> =>
    Effect.gen(function* () {
      const context = yield* VideoContext;

      return (stream) => Encodable.make(clip(stream).pipe(Stream.provideService(VideoContext, context)), context);
    });
}
