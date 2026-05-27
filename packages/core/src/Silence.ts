import { Effect, Stream } from "effect";

import type { AudioClip } from "./AudioClip";
import { AudioContext } from "./AudioContext";
import { Effectable } from "./Effectable";

export namespace Silence {
  export interface Silence<E = never, R = never> extends AudioClip.AudioClip<E, R | AudioContext> {}

  export const make = <E = never, R = never>(samples: Effectable<number, E, R>): Silence<E, R> =>
    Stream.fromEffect(
      AudioContext.use(({ channels, samplerate }) =>
        Effect.map(Effectable.wrap(samples), (samples) => ({
          samplerate,
          channels: globalThis.Array.from({ length: channels }, () => new Float32Array(samples)),
        })),
      ),
    );
}
