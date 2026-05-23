import { Effect, Stream } from "effect";
import { Effectable } from "./Effectable";
import type { SampleCount } from "./media";
import { AudioClip } from "./AudioClip";

export namespace Silence {
  export interface Silence<E = never, R = never> extends AudioClip.AudioClip<E, R> {}

  export const make = <E = never, R = never>(samples: Effectable<SampleCount, E, R>): Silence<E, R> => {
    return {
      render: Stream.unwrap(
        Effect.map(Effectable.resolve(samples), (samples) =>
          Stream.make({
            _tag: "SilentAudioChunk",
            samples,
          }),
        ),
      ),
    };
  };
}
