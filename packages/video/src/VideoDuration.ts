import { Data, Duration, Effect, Schema } from "effect";

import { VideoMetadata } from "./VideoMetadata";

export namespace VideoDuration {
  export const Rounding = Schema.Literals(["floor", "ceil", "round"]);
  export type Rounding = typeof Rounding.Type;

  export const make = (
    input: Duration.Input,
    rounding: Rounding = "round",
  ): Effect.Effect<number, VideoDuration.Error, VideoMetadata> =>
    Effect.gen(function* () {
      const duration = Duration.toSeconds(Duration.fromInputUnsafe(input));

      const { framerate } = yield* VideoMetadata;
      if (!framerate) {
        return yield* new VideoDuration.Error({ reason: new VideoDuration.Error.MissingFramerate() });
      }

      return Math[Schema.decodeSync(Rounding)(rounding)](duration * framerate);
    });

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.MissingFramerate;
  }> {}
  export namespace Error {
    export class MissingFramerate extends Data.TaggedError("MissingFramerate")<{}> {}
  }
}
