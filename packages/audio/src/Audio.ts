import { Effect, Stream } from "effect";

import type { AudioClip } from "@veya/core";

import { AudioDecoder } from "./AudioDecoder";

export namespace Audio {
  export type Options<E = never, R = never> = {
    readonly samplerate?: Effect.Effect<number, E, R>;
    readonly channels?: Effect.Effect<number, E, R>;
    readonly offset?: Effect.Effect<number, E, R>;
    readonly duration?: Effect.Effect<number, E, R>;
    readonly speed?: Effect.Effect<number, E, R>;
  };

  export interface Audio<E = never, R = never> extends AudioClip.AudioClip<
    E | AudioDecoder.AudioDecoderError,
    R | AudioDecoder
  > {}

  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: AudioDecoder.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Audio<SE | OE, SR | OR> => {
    return Stream.unwrap(
      Effect.gen(function* () {
        const { decode } = yield* AudioDecoder;

        return decode(source, yield* Effect.all(options, { concurrency: "unbounded" }));
      }),
    );
  };
}
