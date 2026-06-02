import { Effect, Iterable, Option, Stream } from "effect";

import { VideoClip } from "./VideoClip";
import { VideoContext } from "./VideoContext";
import { VideoResampler } from "./VideoResampler";

export namespace VideoTrack {
  export type VideoTrack<I, IE = never, IR = never, OE = never, OR = never> = VideoClip.VideoClip<I, IE, IR, OE, OR>;

  export const make = <I, IE = never, IR = never, OE = never, OR = never>(
    clips: Iterable<VideoClip.VideoClip<I, IE, IR, OE, OR>>,
  ): Effect.Effect<VideoTrack<I, IE, IR, OE | VideoResampler.Error, OR>, never, VideoContext> => {
    return VideoClip.make((stream) => {
      return Stream.unwrap(
        Effect.gen(function* () {
          const context = yield* VideoContext;
          const { resample } = yield* Effect.serviceOption(VideoResampler).pipe(
            Effect.map(Option.getOrElse(() => VideoResampler.service)),
          );

          const resampled = Iterable.map(clips, (clip) => {
            const encodable = resample(clip, { target: context.framerate })(stream);

            return Stream.map(encodable, (bitmap) => VideoClip.Bitmap.fit(bitmap, encodable.context.size, context.size));
          });
          const empty: Stream.Stream<VideoClip.Bitmap, OE | VideoResampler.Error, OR> = Stream.empty;

          return Iterable.reduce(resampled, empty, (track, clip) => Stream.concat(track, clip));
        }),
      );
    });
  };
}
