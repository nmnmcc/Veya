import { Data, Duration, Effect, Schema } from "effect";

import { AudioMetadata } from "./AudioMetadata";

export namespace AudioDuration {
  /** Rounding strategy used when converting time into sample counts. */
  export const Rounding = Schema.Literals(["floor", "ceil", "round"]);
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

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.MissingSamplerate;
  }> {}
  export namespace Error {
    /** Indicates that the active audio metadata has no sample rate. */
    export class MissingSamplerate extends Data.TaggedError("MissingSamplerate")<{}> {}
  }
}
