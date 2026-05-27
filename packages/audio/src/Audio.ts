import { Effect, pipe, Stream } from "effect";

import { type AudioClip, Effectable } from "@veya/core";

import { AudioDecoder } from "./AudioDecoder";
import { AudioMetadata } from "./AudioMetadata";
import { AudioProber } from "./AudioProber";

export namespace Audio {
  export type Options<E = never, R = never> = {
    readonly samplerate?: Effectable<number, E, R>;
    readonly channels?: Effectable<number, E, R>;
    readonly offset?: Effectable<number, E, R>;
    readonly duration?: Effectable<number, E, R>;
    readonly speed?: Effectable<number, E, R>;
  };

  export interface Audio<E = never, R = never> extends AudioClip.AudioClip<
    E | AudioDecoder.AudioDecoderError | AudioProber.AudioProberError,
    R | AudioDecoder | AudioProber
  > {}

  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: AudioDecoder.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Audio<SE | OE, SR | Exclude<OR, AudioMetadata>> => {
    return Stream.unwrap(
      Effect.gen(function* () {
        const { probe } = yield* AudioProber;
        const { decode } = yield* AudioDecoder;
        const metadata = yield* probe(source);

        return decode(
          source,
          yield* pipe(
            Effect.all(Effectable.map({ ...metadata, ...options }), { concurrency: "unbounded" }),
            Effect.provideService(AudioMetadata, metadata),
          ),
        );
      }),
    );
  };
}
