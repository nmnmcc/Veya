import { Data, Duration, Effect, Schema } from "effect";

import { VideoMetadata } from "./VideoMetadata";

export namespace VideoDuration {
  /** Rounding strategy used when converting time into frame counts. */
  export const Rounding = Schema.Literals(["floor", "ceil", "round"]);
  export type Rounding = typeof Rounding.Type;

  /** Converts an Effect duration input into a source frame count using `VideoMetadata.framerate`. */
  export const make = (
    input: Duration.Input,
    rounding: Rounding = "round",
  ): Effect.Effect<number, VideoDuration.Error, VideoMetadata> =>
    Effect.gen(function* () {
      const seconds = Duration.toSeconds(Duration.fromInputUnsafe(input));

      const { framerate } = yield* VideoMetadata;
      if (!framerate) {
        return yield* new VideoDuration.Error({ reason: new VideoDuration.Error.MissingFramerate() });
      }

      return Math[Schema.decodeSync(Rounding)(rounding)](seconds * framerate);
    });

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.MissingFramerate;
  }> {}
  export namespace Error {
    /** Indicates that the active video metadata has no framerate. */
    export class MissingFramerate extends Data.TaggedError("MissingFramerate")<{}> {}
  }
}
