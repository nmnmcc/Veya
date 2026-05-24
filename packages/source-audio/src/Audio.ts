import { Effect, Stream } from "effect";
import { Effectable } from "@veya/core";
import type { AudioClip, ChannelCount, SampleCount, Samplerate } from "@veya/core";
import { AudioSource } from "./AudioSource";

export namespace Audio {
  export type MediaSource<E = never, R = never> = AudioSource.MediaSource<E, R>;

  export type Service = InstanceType<typeof AudioSource>;

  export const AudioSourceError = AudioSource.AudioSourceError;
  export type AudioSourceError = AudioSource.AudioSourceError;

  export type DecodeOptions = AudioSource.DecodeOptions;

  export interface Options<E = never, R = never> {
    readonly samplerate?: Effectable<Samplerate, E, R>;
    readonly channels?: Effectable<ChannelCount, E, R>;
    readonly offset?: Effectable<SampleCount, E, R>;
    readonly duration?: Effectable<SampleCount, E, R>;
    readonly speed?: Effectable<number, E, R>;
  }

  export interface Audio<SourceE = never, SourceR = never, E = never, R = never> extends AudioClip.AudioClip<
    SourceE | E | AudioSourceError,
    SourceR | R | Service
  > {
    readonly source: Effectable<MediaSource<SourceE, SourceR>, E, R>;
    readonly samplerate?: Effectable<Samplerate, E, R>;
    readonly channels?: Effectable<ChannelCount, E, R>;
    readonly offset?: Effectable<SampleCount, E, R>;
    readonly duration?: Effectable<SampleCount, E, R>;
    readonly speed?: Effectable<number, E, R>;
  }

  export const make = Effect.fn("Audio.make")(function* <SourceE = never, SourceR = never, E = never, R = never>(
    source: Effectable<MediaSource<SourceE, SourceR>, E, R>,
    options: Effectable<Options<E, R>, E, R> = {},
  ): Effect.fn.Return<Audio<SourceE, SourceR, E, R>, E, R> {
    const resolvedSource = yield* Effectable.resolve(source);
    const resolvedOptions = yield* Effectable.resolve(options);

    return {
      source: resolvedSource,
      samplerate: resolvedOptions.samplerate,
      channels: resolvedOptions.channels,
      offset: resolvedOptions.offset,
      duration: resolvedOptions.duration,
      speed: resolvedOptions.speed,
      render: Stream.unwrap(
        Effect.gen(function* () {
          const { decode } = yield* AudioSource;
          const decodeOptions = yield* resolveDecodeOptions(resolvedOptions);

          return decode(resolvedSource, decodeOptions);
        }),
      ),
    };
  });

  const resolveDecodeOptions = <E, R>(options: Options<E, R>): Effect.Effect<DecodeOptions, E, R> => {
    return Effect.gen(function* () {
      const samplerate = options.samplerate === undefined ? undefined : yield* Effectable.resolve(options.samplerate);
      const channels = options.channels === undefined ? undefined : yield* Effectable.resolve(options.channels);
      const offset = options.offset === undefined ? undefined : yield* Effectable.resolve(options.offset);
      const samples = options.duration === undefined ? undefined : yield* Effectable.resolve(options.duration);
      const speed = options.speed === undefined ? undefined : yield* Effectable.resolve(options.speed);

      return { samplerate, channels, offset, samples, speed };
    });
  };
}
