import { Effect, pipe, Stream } from "effect";

import { type AudioClip, AudioContext, Effectable } from "@veya/core";

import { AudioDecoder } from "./AudioDecoder";
import { AudioMetadata } from "./AudioMetadata";
import { AudioProber } from "./AudioProber";
import { AudioResampler } from "./AudioResampler";

export namespace Audio {
  export type Options<E = never, R = never> = {
    readonly offset?: Effectable<number, E, R>;
    readonly duration?: Effectable<number, E, R>;
    readonly speed?: Effectable<number, E, R>;
  };

  export interface Audio<E = never, R = never> extends AudioClip.AudioClip<
    E | AudioDecoder.AudioDecoderError | AudioProber.AudioProberError | AudioResampler.AudioResamplerError,
    R | AudioContext | AudioDecoder | AudioProber | AudioResampler
  > {}

  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: AudioDecoder.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Audio<SE | OE, SR | Exclude<OR, AudioMetadata>> => {
    return Stream.unwrap(
      Effect.gen(function* () {
        const { probe } = yield* AudioProber;
        const { decode } = yield* AudioDecoder;
        const { samplerate: targetSamplerate } = yield* AudioContext;
        const metadata = yield* probe(source);

        const decoded = decode(
          source,
          yield* pipe(
            Effect.all(Effectable.map(options), { concurrency: "unbounded" }),
            Effect.provideService(AudioMetadata, metadata),
          ),
        );

        const sourceSamplerate = metadata.samplerate;

        if (!sourceSamplerate || sourceSamplerate === targetSamplerate) {
          return decoded;
        }

        const { resample } = yield* AudioResampler;

        return Stream.mapEffect(decoded, (channels) =>
          resample(channels, {
            source: sourceSamplerate,
            target: targetSamplerate,
          }),
        );
      }),
    );
  };
}
