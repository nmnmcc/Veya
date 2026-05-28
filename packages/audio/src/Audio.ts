import { Effect, pipe, Stream } from "effect";

import { type AudioClip, AudioContext, type AudioTick, Effectable } from "@veya/core";

import { AudioDecoder } from "./AudioDecoder";
import { AudioMetadata } from "./AudioMetadata";
import { AudioProber } from "./AudioProber";
import { AudioResampler } from "./AudioResampler";

export namespace Audio {
  /** Options for decoding an audio source into a clip. */
  export type Options<E = never, R = never> = {
    /** Start time offset, in seconds. */
    readonly offset?: Effectable<number, E, R> | undefined;
    /** Clip duration, in seconds. */
    readonly duration?: Effectable<number, E, R> | undefined;
    /** Playback speed multiplier. */
    readonly speed?: Effectable<number, E, R> | undefined;
  };

  /** A decoded audio clip that matches the active audio render context. */
  export interface Audio<E = never, R = never> extends AudioClip.AudioClip<
    AudioTick,
    never,
    never,
    E | AudioDecoder.Error | AudioProber.Error | AudioResampler.Error,
    R | AudioContext | AudioDecoder | AudioProber | AudioResampler
  > {}

  /** Creates an audio clip from bytes or a byte stream. */
  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: AudioDecoder.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Audio<SE | OE, SR | Exclude<OR, AudioMetadata>> => {
    return (stream) =>
      Stream.unwrap(
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
          )(stream);

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
