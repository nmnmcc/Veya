import { Data, Duration, Effect, Schema } from "effect";

import { AudioMetadata } from "./AudioMetadata";

export namespace AudioDuration {
  export const Rounding = Schema.Literals(["floor", "ceil", "round"]);
  export type Rounding = typeof Rounding.Type;

  export const make = (
    input: Duration.Input,
    rounding: Rounding = "round",
  ): Effect.Effect<number, AudioDurationSamplerateError, AudioMetadata> =>
    Effect.gen(function* () {
      const duration = Duration.toSeconds(Duration.fromInputUnsafe(input));

      const { samplerate } = yield* AudioMetadata;
      if (!samplerate) {
        return yield* new AudioDurationSamplerateError();
      }

      return Math[Schema.decodeSync(Rounding)(rounding)](duration * samplerate);
    });

  export class AudioDurationSamplerateError extends Data.TaggedError("AudioDurationSamplerateError") {}
}
