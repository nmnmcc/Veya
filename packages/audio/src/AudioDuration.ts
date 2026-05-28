import { Data, Duration, Effect, Schema } from "effect";

import { AudioMetadata } from "./AudioMetadata";

export namespace AudioDuration {
  export const Rounding = Schema.Literals(["floor", "ceil", "round"]);
  export type Rounding = typeof Rounding.Type;

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
    export class MissingSamplerate extends Data.TaggedError("MissingSamplerate")<{}> {}
  }
}
