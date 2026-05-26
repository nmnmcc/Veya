import { Effect, Stream } from "effect";
import { CompositeAudioContext } from "./CompositeAudioContext";
import type { SampleCount } from "./media";
import type { AudioClip } from "./AudioClip";

export namespace Silence {
  export interface Silence<E = never, R = never> extends AudioClip.AudioClip<E, R | CompositeAudioContext> {}

  export const make = <E = never, R = never>(samples: Effect.Effect<SampleCount, E, R>): Silence<E, R> =>
    Stream.fromEffect(
      CompositeAudioContext.use(({ channels, samplerate }) =>
        Effect.map(samples, (samples) => ({
          samplerate,
          channels: globalThis.Array.from({ length: channels }, () => new Float32Array(samples)),
        })),
      ),
    );
}
