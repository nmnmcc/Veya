import { Effect, Stream } from "effect";
import { Effectable } from "./Effectable";
import { CompositeAudioContext } from "./CompositeAudioContext";
import type { SampleCount } from "./media";
import { AudioClip } from "./AudioClip";

export namespace Silence {
  export interface Silence<E = never, R = never> extends AudioClip.AudioClip<E, R | CompositeAudioContext> {}

  export const make = <E = never, R = never>(samples: Effectable<SampleCount, E, R>): Silence<E, R> => ({
    render: Stream.fromEffect(
      CompositeAudioContext.use(({ channels, samplerate }) =>
        Effect.map(Effectable.resolve(samples), (samples) => ({
          samplerate,
          channels: globalThis.Array.from({ length: channels }, () => new Float32Array(samples)),
        })),
      ),
    ),
  });
}
