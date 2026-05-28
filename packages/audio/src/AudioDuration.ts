import { Data, Duration, Effect, Schema } from "effect";

import { AudioMetadata } from "./AudioMetadata";

export namespace AudioDuration {
  /** Rounding strategy used when converting seconds to sample counts. */
  export const Rounding = Schema.Literals(["floor", "ceil", "round"]);
  /** Rounding strategy used when converting seconds to sample counts. */
  export type Rounding = typeof Rounding.Type;

  /** Converts an Effect duration input into a number of samples using `AudioMetadata.samplerate`. */
  export const make = (
    input: Duration.Input,
    rounding: Rounding = "round",
  ): Effect.Effect<number, AudioDuration.Error, AudioMetadata> =>
    Effect.gen(function* () {
      const duration = Duration.toSeconds(Duration.fromInputUnsafe(input));

      const { samplerate } = yield* AudioMetadata;
      if (!samplerate) {
        return yield* new AudioDuration.Error({ reason: new AudioDuration.Error.MissingSamplerate() });
      }

      return Math[Schema.decodeSync(Rounding)(rounding)](duration * samplerate);
    });

  /** Error raised when a sample count cannot be computed. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the duration conversion failure. */
    readonly reason: Error.MissingSamplerate;
  }> {}
  export namespace Error {
    /** Indicates that the active audio metadata has no sample rate. */
    export class MissingSamplerate extends Data.TaggedError("MissingSamplerate")<{}> {}
  }
}
