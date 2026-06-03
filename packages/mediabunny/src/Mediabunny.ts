import { Array, Data, Effect, Stream } from "effect";
import {
  AudioSample,
  AudioSampleSource,
  BufferTarget,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  VideoSample,
  VideoSampleSource,
  WavOutputFormat,
} from "mediabunny";
import type {
  AudioEncodingConfig,
  AudioTrackMetadata,
  OutputFormat,
  VideoEncodingConfig,
  VideoSampleInit,
  VideoTrackMetadata,
} from "mediabunny";

import { type AudioClip, VideoClip, type VideoColor, VideoFrame } from "@veya/core";

export namespace Mediabunny {
  export interface Result {
    readonly buffer: Uint8Array;
    readonly mimeType: string;
  }

  export interface Options<VE = never, VR = never, AE = never, AR = never> {
    readonly audio?: AudioOptions<AE, AR> | undefined;
    readonly format?: OutputFormat | undefined;
    readonly video?: VideoOptions<VE, VR> | undefined;
  }

  export interface AudioOptions<E = never, R = never> {
    readonly encodable: AudioClip.Encodable<E, R>;
    readonly encoding?: AudioEncodingConfig | undefined;
    readonly sampleChunkSize?: number | undefined;
    readonly track?: AudioTrackMetadata | undefined;
  }

  export interface VideoOptions<E = never, R = never> {
    readonly encodable: VideoClip.Encodable<E, R>;
    readonly encoding?: VideoEncodingConfig | undefined;
    readonly profile?: Profile | undefined;
    readonly track?: VideoTrackMetadata | undefined;
  }

  export interface Profile {
    readonly onFrame?: ((timing: ProfileFrameTiming) => void) | undefined;
  }

  export interface ProfileFrameTiming {
    readonly addSampleMs: number;
    readonly closeSampleMs: number;
    readonly frame: number;
    readonly frameToSampleMs: number;
    readonly totalMs: number;
  }

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.EncodeFailed | Error.InvalidInput | Error.InvalidOutputBuffer;
  }> {}
  export namespace Error {
    export class EncodeFailed extends Data.TaggedError("EncodeFailed")<{}> {}
    export class InvalidInput extends Data.TaggedError("InvalidInput")<{
      readonly message: string;
    }> {}
    export class InvalidOutputBuffer extends Data.TaggedError("InvalidOutputBuffer")<{}> {}
  }

  export const encode = <VE = never, VR = never, AE = never, AR = never>(
    options: Options<VE, VR, AE, AR>,
  ): Effect.Effect<Result, VE | AE | Error, VR | AR> =>
    Effect.gen(function* () {
      if (options.video === undefined && options.audio === undefined) {
        return yield* invalid("At least one audio or video track is required.");
      }

      const format = options.format ?? (options.video === undefined ? new WavOutputFormat() : new Mp4OutputFormat());
      const multiplexer = yield* makeMultiplexer(format);
      const writers = yield* Effect.all(
        [
          options.video === undefined
            ? Effect.succeed([])
            : addVideoTrack(multiplexer.output, options.video).pipe(Effect.map((writer) => [writer])),
          options.audio === undefined
            ? Effect.succeed([])
            : addAudioTrack(multiplexer.output, options.audio).pipe(Effect.map((writer) => [writer])),
        ],
        { concurrency: "unbounded" },
      ).pipe(Effect.map(Array.flatten));

      const program = Effect.gen(function* () {
        yield* start(multiplexer.output);
        yield* Effect.all(writers, { concurrency: "unbounded" });
        yield* finalize(multiplexer.output);

        return yield* result(multiplexer);
      });

      return yield* program.pipe(Effect.onError(() => cancel(multiplexer.output)));
    });

  const defaultAudioEncoding: AudioEncodingConfig = {
    codec: "pcm-f32",
  };

  const defaultVideoEncoding: VideoEncodingConfig = {
    alpha: "discard",
    bitrate: QUALITY_HIGH,
    codec: "avc",
    keyFrameInterval: 2,
  };

  interface Multiplexer {
    readonly format: OutputFormat;
    readonly output: Output<OutputFormat, BufferTarget>;
    readonly target: BufferTarget;
  }

  const makeMultiplexer = (format: OutputFormat): Effect.Effect<Multiplexer, Error> =>
    Effect.try({
      try: () => {
        const target = new BufferTarget();

        return {
          format,
          output: new Output({
            format,
            target,
          }),
          target,
        };
      },
      catch: toEncodeFailed,
    });

  const addVideoTrack = <E, R>(
    output: Output,
    options: VideoOptions<E, R>,
  ): Effect.Effect<Effect.Effect<void, E | Error, R>, Error> =>
    Effect.gen(function* () {
      const { framerate, size } = options.encodable.context;

      yield* validateVideoContext(options.encodable.context);

      const source = yield* Effect.try({
        try: () => new VideoSampleSource(options.encoding ?? defaultVideoEncoding),
        catch: toEncodeFailed,
      });

      yield* Effect.try({
        try: () => {
          output.addVideoTrack(source, {
            ...options.track,
            frameRate: options.track?.frameRate ?? framerate,
          });
        },
        catch: toEncodeFailed,
      });

      return writeVideoTrack(source, options.encodable, {
        colorSpace: options.encodable.context.colorSpace,
        framerate,
        profile: options.profile,
        size,
      });
    });

  const writeVideoTrack = <E, R>(
    source: VideoSampleSource,
    encodable: VideoClip.Encodable<E, R>,
    options: {
      readonly colorSpace: VideoColor.ColorSpace;
      readonly framerate: number;
      readonly profile?: Profile | undefined;
      readonly size: readonly [width: number, height: number];
    },
  ): Effect.Effect<void, E | Error, R> =>
    Effect.gen(function* () {
      let frameIndex = 0;

      yield* Stream.runForEach(encodable, (frame) =>
        Effect.tryPromise({
          try: async () => {
            const totalStart = globalThis.performance.now();
            const frameToSampleStart = totalStart;
            const sample = frameToSample(frame, {
              colorSpace: options.colorSpace,
              duration: 1 / options.framerate,
              size: options.size,
              timestamp: frameIndex / options.framerate,
            });
            const frameToSampleMs = globalThis.performance.now() - frameToSampleStart;
            const currentFrame = frameIndex;
            frameIndex += 1;
            let addSampleMs = 0;
            let closeSampleMs = 0;

            try {
              const addSampleStart = globalThis.performance.now();
              await source.add(sample);
              addSampleMs = globalThis.performance.now() - addSampleStart;
            } finally {
              const closeSampleStart = globalThis.performance.now();
              sample.close();
              closeSampleMs = globalThis.performance.now() - closeSampleStart;
              options.profile?.onFrame?.({
                addSampleMs,
                closeSampleMs,
                frame: currentFrame,
                frameToSampleMs,
                totalMs: globalThis.performance.now() - totalStart,
              });
            }
          },
          catch: toEncodeFailed,
        }),
      );
    });

  const addAudioTrack = <E, R>(
    output: Output,
    options: AudioOptions<E, R>,
  ): Effect.Effect<Effect.Effect<void, E | Error, R>, Error> =>
    Effect.gen(function* () {
      const { channels, samplerate } = options.encodable.context;
      const sampleChunkSize = Math.floor(options.sampleChunkSize ?? samplerate * 5);

      yield* validateAudioContext(options.encodable.context, sampleChunkSize);

      const source = yield* Effect.try({
        try: () => new AudioSampleSource(options.encoding ?? defaultAudioEncoding),
        catch: toEncodeFailed,
      });

      yield* Effect.try({
        try: () => {
          output.addAudioTrack(source, options.track);
        },
        catch: toEncodeFailed,
      });

      return writeAudioTrack(source, options.encodable, {
        channels,
        sampleChunkSize,
        samplerate,
      });
    });

  const writeAudioTrack = <E, R>(
    source: AudioSampleSource,
    encodable: AudioClip.Encodable<E, R>,
    options: {
      readonly channels: number;
      readonly sampleChunkSize: number;
      readonly samplerate: number;
    },
  ): Effect.Effect<void, E | Error, R> =>
    Effect.gen(function* () {
      let nextTimestamp = 0;

      yield* Stream.runForEach(encodable, (channelGroup) =>
        Effect.gen(function* () {
          if (channelGroup.length !== options.channels) {
            return yield* invalid(`Expected ${options.channels} audio channel(s), got ${channelGroup.length}.`);
          }

          nextTimestamp = yield* encodeChannelGroup(source, channelGroup, {
            sampleChunkSize: options.sampleChunkSize,
            samplerate: options.samplerate,
            timestamp: nextTimestamp,
          });
        }),
      );
    });

  const encodeChannelGroup = (
    source: AudioSampleSource,
    channels: readonly AudioClip.Channel[],
    options: {
      readonly sampleChunkSize: number;
      readonly samplerate: number;
      readonly timestamp: number;
    },
  ): Effect.Effect<number, Error> =>
    Effect.gen(function* () {
      const [head, ...tail] = channels.map((channel) => channel.pipe(Stream.grouped(options.sampleChunkSize)));

      if (head === undefined) {
        return yield* invalid("Audio channel group must contain at least one channel.");
      }

      type AudioChunk = readonly (readonly number[])[];
      const chunks = tail.reduce<Stream.Stream<AudioChunk>>(
        (groups, channel) => Stream.zipWith(groups, channel, (groups, chunk): AudioChunk => [...groups, chunk]),
        Stream.map(head, (chunk): AudioChunk => [chunk]),
      );
      let timestamp = options.timestamp;

      yield* Stream.runForEach(chunks, (channelChunks) =>
        Effect.gen(function* () {
          const frames = yield* validateAudioChunk(channelChunks);
          const sample = makeAudioSample(channelChunks, {
            frames,
            samplerate: options.samplerate,
            timestamp,
          });

          yield* addAudioSample(source, sample);
          timestamp += frames / options.samplerate;
        }),
      );

      return timestamp;
    });

  const addAudioSample = (source: AudioSampleSource, sample: AudioSample): Effect.Effect<void, Error> =>
    Effect.tryPromise({
      try: async () => {
        try {
          await source.add(sample);
        } finally {
          sample.close();
        }
      },
      catch: toEncodeFailed,
    });

  const frameToSample = (
    frame: VideoFrame,
    options: {
      readonly colorSpace: VideoColor.ColorSpace;
      readonly duration: number;
      readonly size: readonly [width: number, height: number];
      readonly timestamp: number;
    },
  ): VideoSample => {
    const [width, height] = options.size;

    return new VideoSample(frame, {
      codedHeight: height,
      codedWidth: width,
      colorSpace: toSampleColorSpace(options.colorSpace),
      duration: options.duration,
      format: "RGBA",
      timestamp: options.timestamp,
    });
  };

  const toSampleColorSpace = (colorSpace: VideoColor.ColorSpace): NonNullable<VideoSampleInit["colorSpace"]> => {
    switch (colorSpace) {
      case "display-p3":
        return {
          fullRange: true,
          matrix: "rgb",
          primaries: "smpte432",
          transfer: "iec61966-2-1",
        } as unknown as NonNullable<VideoSampleInit["colorSpace"]>;
      case "srgb":
        return {
          fullRange: true,
          matrix: "rgb",
          primaries: "bt709",
          transfer: "iec61966-2-1",
        };
    }
  };

  const makeAudioSample = (
    channels: readonly (readonly number[])[],
    options: {
      readonly frames: number;
      readonly samplerate: number;
      readonly timestamp: number;
    },
  ): AudioSample => {
    const data = new Float32Array(channels.length * options.frames);

    for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
      const channel = channels[channelIndex]!;

      for (let frame = 0; frame < options.frames; frame += 1) {
        data[channelIndex * options.frames + frame] = channel[frame]!;
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

  const validateVideoContext = ({
    framerate,
    size: [width, height],
  }: VideoClip.Encodable["context"]): Effect.Effect<void, Error> => {
    if (!Number.isFinite(framerate) || framerate <= 0) {
      return invalid(`Video framerate must be positive, got ${framerate}.`);
    }

    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      return invalid(`Video frame size must use positive integer dimensions, got ${width}x${height}.`);
    }

    return Effect.void;
  };

  const validateAudioContext = (
    { channels, samplerate }: AudioClip.Encodable["context"],
    sampleChunkSize: number,
  ): Effect.Effect<void, Error> => {
    if (!Number.isInteger(channels) || channels <= 0) {
      return invalid(`Audio channel count must be a positive integer, got ${channels}.`);
    }

    if (!Number.isInteger(samplerate) || samplerate <= 0) {
      return invalid(`Audio samplerate must be a positive integer, got ${samplerate}.`);
    }

    if (!Number.isFinite(sampleChunkSize) || sampleChunkSize <= 0) {
      return invalid(`Audio sampleChunkSize must be positive, got ${sampleChunkSize}.`);
    }

    return Effect.void;
  };

  const validateAudioChunk = (channels: readonly (readonly number[])[]): Effect.Effect<number, Error> => {
    const expectedFrames = channels[0]?.length ?? 0;

    if (expectedFrames === 0) {
      return invalid("Audio sample chunks must not be empty.");
    }

    for (const channel of channels) {
      if (channel.length !== expectedFrames) {
        return invalid("Audio channels in a channel group must have the same number of samples.");
      }
    }

    return Effect.succeed(expectedFrames);
  };

  const start = (output: Output): Effect.Effect<void, Error> =>
    Effect.tryPromise({
      try: () => output.start(),
      catch: toEncodeFailed,
    });

  const finalize = (output: Output): Effect.Effect<void, Error> =>
    Effect.tryPromise({
      try: () => output.finalize(),
      catch: toEncodeFailed,
    });

  const cancel = (output: Output): Effect.Effect<void> =>
    Effect.tryPromise({
      try: async () => {
        if (output.state !== "canceled" && output.state !== "finalized" && output.state !== "finalizing") {
          await output.cancel();
        }
      },
      catch: toEncodeFailed,
    }).pipe(Effect.ignore);

  const result = ({ format, target }: Multiplexer): Effect.Effect<Result, Error> => {
    if (target.buffer === null) {
      return Effect.fail(
        new Error({
          reason: new Error.InvalidOutputBuffer(),
        }),
      );
    }

    return Effect.succeed({
      buffer: new Uint8Array(target.buffer),
      mimeType: format.mimeType,
    });
  };

  const invalid = (message: string): Effect.Effect<never, Error> =>
    Effect.fail(
      new Error({
        reason: new Error.InvalidInput({ message }),
      }),
    );

  const toEncodeFailed = (cause: unknown): Error =>
    cause instanceof Error
      ? cause
      : new Error({
          cause,
          reason: new Error.EncodeFailed(),
        });
}
