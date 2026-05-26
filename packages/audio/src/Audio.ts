import { Effect, Stream } from "effect";
import type { AudioClip, ChannelCount, SampleCount, Samplerate } from "@veya/core";
import { AudioSource } from "./AudioSource";

export namespace Audio {
  export type Options<E = never, R = never> = {
    readonly samplerate?: Effect.Effect<Samplerate, E, R>;
    readonly channels?: Effect.Effect<ChannelCount, E, R>;
    readonly offset?: Effect.Effect<SampleCount, E, R>;
    readonly duration?: Effect.Effect<SampleCount, E, R>;
    readonly speed?: Effect.Effect<number, E, R>;
  };

  export interface Audio<E = never, R = never> extends AudioClip.AudioClip<
    E | AudioSource.AudioSourceError,
    R | AudioSource
  > {}

  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: AudioSource.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Audio<SE | OE, SR | OR> => {
    return Stream.unwrap(
      Effect.gen(function* () {
        const { decode } = yield* AudioSource;
        const { duration, ...decodeOptions } = yield* Effect.all(options, { concurrency: "unbounded" });

        return decode(source, {
          ...decodeOptions,
          samples: duration,
        });
      }),
    );
  };
}
