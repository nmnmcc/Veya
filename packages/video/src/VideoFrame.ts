import { Data, Duration, Effect } from "effect";

import { VideoMetadata } from "./VideoMetadata";

export namespace VideoFrame {
  export type Rounding = "floor" | "ceil" | "round";

  export const fromDuration = (
    input: Duration.Input,
    rounding: Rounding = "round",
  ): Effect.Effect<number, VideoFrameProbeFramerateError, VideoMetadata> =>
    Effect.gen(function* () {
      const duration = Duration.toSeconds(Duration.fromInputUnsafe(input));

      const { framerate } = yield* VideoMetadata;
      if (!framerate) {
        return yield* new VideoFrameProbeFramerateError();
      }

      return Math[rounding](duration * framerate);
    });

  export class VideoFrameProbeFramerateError extends Data.TaggedError("VideoFrameProbeFramerateError") {}
}
