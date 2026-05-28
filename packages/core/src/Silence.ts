import { Effect, Stream } from "effect";

import type { AudioClip } from "./AudioClip";
import { AudioContext } from "./AudioContext";
import type { AudioTick } from "./AudioTick";
import { Effectable } from "./Effectable";

export namespace Silence {
  /** Silent audio samples that occupy time between clips. */
  export interface Silence<E = never, R = never> extends AudioClip.AudioClip<
    AudioTick,
    never,
    never,
    E,
    R | AudioContext
  > {}

  /** Creates silence for the requested number of samples. */
  export const make =
    <E = never, R = never>(samples: Effectable<number, E, R>): Silence<E, R> =>
    (stream) =>
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
      );
}
