import { Effect, Stream } from "effect";

import { AudioClip } from "./AudioClip";
import { AudioContext } from "./AudioContext";
import type { AudioTick } from "./AudioTick";
import { Effectable } from "./Effectable";

export namespace Silence {
  export interface Silence<E = never, R = never> extends AudioClip.AudioClip<
    AudioTick,
    never,
    never,
    E,
    R | AudioContext
  > {}

  export const make = <E = never, R = never>(
    samples: Effectable<number, E, R>,
  ): Effect.Effect<Silence<E, R>, never, AudioContext> =>
    AudioClip.make<AudioTick, never, never, E, R | AudioContext>((stream) =>
      Stream.fromEffect(
        AudioContext.use(({ channels }) =>
          Effect.map(Effectable.wrap(samples), (samples) =>
            globalThis.Array.from({ length: channels }, () =>
              stream.pipe(
                Stream.take(samples),
                Stream.map(() => 0),
              ),
            ),
          ),
        ),
      ),
    );
}
