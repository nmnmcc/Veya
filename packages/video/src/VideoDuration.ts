import { Data, Duration, Effect, Schema } from "effect";

import { VideoMetadata } from "./VideoMetadata";

export namespace VideoDuration {
  export const Rounding = Schema.Literals(["floor", "ceil", "round"]);
  export type Rounding = typeof Rounding.Type;

  export const make = (
    input: Duration.Input,
    rounding: Rounding = "round",
  ): Effect.Effect<number, VideoDurationFramerateError, VideoMetadata> =>
    Effect.gen(function* () {
      const duration = Duration.toSeconds(Duration.fromInputUnsafe(input));

      const { framerate } = yield* VideoMetadata;
      if (!framerate) {
        return yield* new VideoDurationFramerateError();
      }

      return Math[Schema.decodeSync(Rounding)(rounding)](duration * framerate);
    });

  export class VideoDurationFramerateError extends Data.TaggedError("VideoDurationFramerateError") {}
}
