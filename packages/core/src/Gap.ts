import { Effect, pipe, Stream } from "effect";

import { Effectable } from "./Effectable";
import { VideoClip } from "./VideoClip";
import { VideoColor } from "./VideoColor";
import { VideoContext } from "./VideoContext";

export namespace Gap {
  export interface Gap<I, E = never, R = never> extends VideoClip.VideoClip<I, never, never, E, R> {}

  export const make = <I, E = never, R = never>(
    duration: Effectable<number, E, R>,
  ): Effect.Effect<Gap<I, E, R>, never, VideoContext> =>
    VideoClip.make((stream) =>
      Stream.unwrap(
        VideoContext.use(({ size }) =>
          Effect.map(Effectable.wrap(duration), (duration) =>
            pipe(
              stream,
              Stream.take(duration),
              Stream.map(() => VideoClip.Bitmap.make(size, VideoClip.Pixel.fromColor(VideoColor.Transparent))),
            ),
          ),
        ),
      ),
    );
}
