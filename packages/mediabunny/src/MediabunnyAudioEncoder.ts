import { Effect, Stream } from "effect";
import { AudioSample, AudioSampleSource, WavOutputFormat } from "mediabunny";
import type { AudioEncodingConfig, AudioTrackMetadata, OutputFormat } from "mediabunny";

import { type AudioClip, type AudioEncodable } from "@veya/core";

import { MediabunnyEncoding } from "./MediabunnyEncoding";
import { MediabunnyMultiplexer } from "./MediabunnyMultiplexer";

export namespace MediabunnyAudioEncoder {
  export interface Options {
    /** Audio codec configuration passed to `AudioSampleSource`. */
    readonly encoding?: AudioEncodingConfig | undefined;
    /** Container/output format. Defaults to WAV. */
    readonly format?: OutputFormat | undefined;
    /** Number of samples to write per encoder chunk. Defaults to five seconds of audio. */
    readonly sampleChunkSize?: number | undefined;
    /** Optional audio track metadata passed to Mediabunny. */
    readonly track?: AudioTrackMetadata | undefined;
  }

  export const encode = <E = never, R = never>(
    encodable: AudioEncodable<E, R>,
    options: Options = {},
  ): Effect.Effect<MediabunnyEncoding.Result, E | MediabunnyEncoding.Error, R> =>
    Effect.gen(function* () {
      const { channels, samplerate } = encodable.context;
      const format = options.format ?? new WavOutputFormat();
      const encoding = options.encoding ?? defaultEncoding;
      const sampleChunkSize = options.sampleChunkSize ?? samplerate * 5;
      const source = new AudioSampleSource(encoding);

      if (!Number.isInteger(channels) || channels <= 0) {
        return yield* new MediabunnyEncoding.Error({
          reason: new MediabunnyEncoding.Error.InvalidAudioClip({
            message: `Audio channel count must be a positive integer, got ${channels}.`,
          }),
        });
      }

      if (!Number.isInteger(samplerate) || samplerate <= 0) {
        return yield* new MediabunnyEncoding.Error({
          reason: new MediabunnyEncoding.Error.InvalidAudioClip({
            message: `Audio samplerate must be a positive integer, got ${samplerate}.`,
          }),
        });
      }

      if (!Number.isFinite(sampleChunkSize) || sampleChunkSize <= 0) {
        return yield* new MediabunnyEncoding.Error({
          reason: new MediabunnyEncoding.Error.InvalidAudioClip({
            message: `Audio sampleChunkSize must be positive, got ${sampleChunkSize}.`,
          }),
        });
      }

      return yield* MediabunnyMultiplexer.multiplex({
        format,
        setup: ({ output }) => {
          output.addAudioTrack(source, options.track);
        },
        write: () =>
          Effect.gen(function* () {
            let nextTimestamp = 0;

            yield* Stream.runForEach(encodable, (channelGroup) =>
              Effect.gen(function* () {
                const samples = yield* collectChannels(channelGroup, channels);

                nextTimestamp = yield* encodeChannels(source, samples, {
                  sampleChunkSize,
                  samplerate,
                  timestamp: nextTimestamp,
                });
              }),
            );
          }),
      });
    });

  const defaultEncoding: AudioEncodingConfig = {
    codec: "pcm-f32",
  };

  const collectChannels = (
    channels: readonly AudioClip.Channel[],
    expectedChannels: number,
  ): Effect.Effect<readonly (readonly number[])[], MediabunnyEncoding.Error> =>
    Effect.gen(function* () {
      if (channels.length !== expectedChannels) {
        return yield* new MediabunnyEncoding.Error({
          reason: new MediabunnyEncoding.Error.InvalidAudioClip({
            message: `Expected ${expectedChannels} audio channel(s), got ${channels.length}.`,
          }),
        });
      }

      const collected = yield* Effect.all(channels.map(collectChannel), { concurrency: "unbounded" });
      const expectedFrames = collected[0]?.length ?? 0;

      for (const channel of collected) {
        if (channel.length !== expectedFrames) {
          return yield* new MediabunnyEncoding.Error({
            reason: new MediabunnyEncoding.Error.InvalidAudioClip({
              message: "Audio channels in a channel group must have the same number of samples.",
            }),
          });
        }
      }

      return collected;
    });

  const collectChannel = (channel: AudioClip.Channel): Effect.Effect<readonly number[]> =>
    Effect.gen(function* () {
      const samples: number[] = [];

      yield* Stream.runForEach(channel, (sample) =>
        Effect.sync(() => {
          samples.push(sample);
        }),
      );

      return samples;
    });

  const encodeChannels = (
    source: AudioSampleSource,
    channels: readonly (readonly number[])[],
    options: {
      readonly sampleChunkSize: number;
      readonly samplerate: number;
      readonly timestamp: number;
    },
  ): Effect.Effect<number, MediabunnyEncoding.Error> =>
    Effect.tryPromise({
      try: async () => {
        const frameCount = channels[0]?.length ?? 0;
        const chunkSize = Math.max(1, Math.floor(options.sampleChunkSize));
        let timestamp = options.timestamp;

        for (let offset = 0; offset < frameCount; offset += chunkSize) {
          const frames = Math.min(chunkSize, frameCount - offset);
          const sample = makeSample(channels, {
            frames,
            offset,
            samplerate: options.samplerate,
            timestamp,
          });

          try {
            await source.add(sample);
          } finally {
            sample.close();
          }

          timestamp += frames / options.samplerate;
        }

        return timestamp;
      },
      catch: (cause) => MediabunnyEncoding.toEncodeFailed(cause),
    });

  const makeSample = (
    channels: readonly (readonly number[])[],
    options: {
      readonly frames: number;
      readonly offset: number;
      readonly samplerate: number;
      readonly timestamp: number;
    },
  ): AudioSample => {
    const data = new Float32Array(channels.length * options.frames);

    for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
      const channel = channels[channelIndex] ?? [];

      for (let frame = 0; frame < options.frames; frame += 1) {
        data[channelIndex * options.frames + frame] = finiteOr(channel[options.offset + frame] ?? 0, 0);
      }
    }

    return new AudioSample({
      data,
      format: "f32-planar",
      numberOfChannels: channels.length,
      sampleRate: options.samplerate,
      timestamp: options.timestamp,
    });
  };

  const finiteOr = (value: number, fallback: number): number => (Number.isFinite(value) ? value : fallback);
}
