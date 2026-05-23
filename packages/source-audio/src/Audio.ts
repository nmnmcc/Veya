import { Context, Data, Effect, Stream } from "effect";
import { Effectable } from "@veya/core";
import type { AudioChunk, AudioClip, ChannelCount, SampleCount, SampleRate } from "@veya/core";
import { AudioProbe } from "./AudioProbe";

export namespace Audio {
  export type MediaSource<E = never, R = never> = AudioProbe.MediaSource<E, R>;

  export class AudioSourceError extends Data.TaggedError("AudioSourceError")<{
    readonly reason?: unknown;
  }> {}

  export interface DecodeOptions {
    readonly sampleRate?: SampleRate;
    readonly channels?: ChannelCount;
    readonly offset?: SampleCount;
    readonly samples?: SampleCount;
    readonly speed?: number;
  }

  export interface Options<E = never, R = never> {
    readonly sampleRate?: Effectable<SampleRate, E, R>;
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
    readonly sampleRate?: Effectable<SampleRate, E, R>;
    readonly channels?: Effectable<ChannelCount, E, R>;
    readonly offset?: Effectable<SampleCount, E, R>;
    readonly duration?: Effectable<SampleCount, E, R>;
    readonly speed?: Effectable<number, E, R>;
  }

  export interface AudioSource {
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: DecodeOptions,
    ) => Stream.Stream<AudioChunk, SourceE | AudioSourceError, SourceR>;
  }

  export class Service extends Context.Service<Service, AudioSource>()("@veya/source-audio/Audio/Service") {}

  export const make = <SourceE = never, SourceR = never, E = never, R = never>(
    source: Effectable<MediaSource<SourceE, SourceR>, E, R>,
    options: Effectable<Options<E, R>, E, R> = {},
  ): Audio<SourceE, SourceR, E, R> => {
    const immediateOptions = Effect.isEffect(options) ? undefined : options;

    return {
      source,
      sampleRate: immediateOptions?.sampleRate,
      channels: immediateOptions?.channels,
      offset: immediateOptions?.offset,
      duration: immediateOptions?.duration,
      speed: immediateOptions?.speed,
      render: Stream.unwrap(
        Service.use(({ decode }) =>
          Effect.gen(function* () {
            const resolvedSource = yield* Effectable.resolve(source);
            const resolvedOptions = yield* Effectable.resolve(options);
            const decodeOptions = yield* resolveDecodeOptions(resolvedOptions);

            return decode(resolvedSource, decodeOptions);
          }),
        ),
      ),
    };
  };

  const resolveDecodeOptions = <E, R>(options: Options<E, R>): Effect.Effect<DecodeOptions, E, R> => {
    return Effect.gen(function* () {
      const sampleRate = options.sampleRate === undefined ? undefined : yield* Effectable.resolve(options.sampleRate);
      const channels = options.channels === undefined ? undefined : yield* Effectable.resolve(options.channels);
      const offset = options.offset === undefined ? undefined : yield* Effectable.resolve(options.offset);
      const samples = options.duration === undefined ? undefined : yield* Effectable.resolve(options.duration);
      const speed = options.speed === undefined ? undefined : yield* Effectable.resolve(options.speed);

      return { sampleRate, channels, offset, samples, speed };
    });
  };
}
