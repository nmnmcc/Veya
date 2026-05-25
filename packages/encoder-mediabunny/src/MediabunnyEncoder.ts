import { Effect, Layer, Stream } from "effect";
import { Effectable, Encoder } from "@veya/core";
import type { AudioBuffer, Bitmap, Composite, Size } from "@veya/core";
import {
  AdtsOutputFormat,
  AudioSample,
  AudioSampleSource,
  BufferTarget,
  FlacOutputFormat,
  MkvOutputFormat,
  MovOutputFormat,
  Mp3OutputFormat,
  Mp4OutputFormat,
  MpegTsOutputFormat,
  OggOutputFormat,
  Output,
  QUALITY_HIGH,
  VideoSample,
  VideoSampleSource,
  WavOutputFormat,
  WebMOutputFormat,
} from "mediabunny";
import type {
  AudioCodec,
  AudioEncodingConfig,
  OutputFormat,
  Quality,
  VideoCodec,
  VideoEncodingConfig,
} from "mediabunny";

export namespace MediabunnyEncoder {
  export type FormatFactory = () => OutputFormat;

  export interface VideoOptions {
    readonly codec?: VideoCodec;
    readonly bitrate?: number | Quality;
    readonly keyFrameInterval?: number;
    readonly sizeChangeBehavior?: VideoEncodingConfig["sizeChangeBehavior"];
    readonly transform?: VideoEncodingConfig["transform"];
    readonly alpha?: VideoEncodingConfig["alpha"];
    readonly bitrateMode?: VideoEncodingConfig["bitrateMode"];
    readonly latencyMode?: VideoEncodingConfig["latencyMode"];
    readonly fullCodecString?: VideoEncodingConfig["fullCodecString"];
    readonly hardwareAcceleration?: VideoEncodingConfig["hardwareAcceleration"];
    readonly scalabilityMode?: VideoEncodingConfig["scalabilityMode"];
    readonly contentHint?: VideoEncodingConfig["contentHint"];
  }

  export interface AudioOptions {
    readonly codec?: AudioCodec;
    readonly bitrate?: number | Quality;
    readonly transform?: AudioEncodingConfig["transform"];
    readonly bitrateMode?: AudioEncodingConfig["bitrateMode"];
    readonly fullCodecString?: AudioEncodingConfig["fullCodecString"];
  }

  export interface Options {
    readonly formats?: Readonly<Record<string, FormatFactory>>;
    readonly video?: VideoOptions;
    readonly audio?: AudioOptions;
  }

  export const make = (options: Options = {}): Encoder.Encoder => ({
    encode: <VideoE = never, VideoR = never, AudioE = VideoE, AudioR = VideoR>(
      composite: Composite.Composite<VideoE, VideoR, AudioE, AudioR>,
      encodeOptions: Encoder.Options,
    ): Encoder.EncodedFile<VideoE | AudioE | Encoder.EncoderError, VideoR | AudioR> => {
      const formatFactory = getFormatFactory(encodeOptions.container, options);
      const mimeType = getMimeType(formatFactory);

      return {
        filename: encodeOptions.filename,
        mimeType,
        data: Stream.unwrap(
          Effect.map(encodeToBytes(composite, encodeOptions, options, formatFactory), (bytes) => Stream.make(bytes)),
        ),
      };
    },
  });

  export const layer = (options: Options = {}) => Layer.succeed(Encoder, make(options));

  const encodeToBytes = <VideoE, VideoR, AudioE, AudioR>(
    composite: Composite.Composite<VideoE, VideoR, AudioE, AudioR>,
    encodeOptions: Encoder.Options,
    options: Options,
    formatFactory: FormatFactory | undefined,
  ): Effect.Effect<Uint8Array, VideoE | AudioE | Encoder.EncoderError, VideoR | AudioR> => {
    if (formatFactory === undefined) {
      return Effect.fail(encoderError(`unsupported container: ${encodeOptions.container}`));
    }

    return Effect.gen(function* () {
      const format = yield* trySync(() => formatFactory());
      const target = new BufferTarget();
      const output = new Output({ format, target });

      const videoConfig = yield* resolveVideoConfig(format, encodeOptions, options.video);
      const audioConfig = yield* resolveAudioConfig(format, encodeOptions, options.audio);

      const videoSource = videoConfig === undefined ? undefined : new VideoSampleSource(videoConfig);
      const audioSource = audioConfig === undefined ? undefined : new AudioSampleSource(audioConfig);

      if (videoSource !== undefined) output.addVideoTrack(videoSource);
      if (audioSource !== undefined) output.addAudioTrack(audioSource);

      yield* tryPromise(() => output.start());

      if (videoSource !== undefined) {
        const { size, framerate } = yield* Effectable.all({
          size: composite.video.size,
          framerate: composite.video.framerate,
        });
        yield* writeVideo(composite.video.render, videoSource, size, framerate);
        videoSource.close();
      }

      if (audioSource !== undefined) {
        yield* writeAudio(composite.audio.render, audioSource);
        audioSource.close();
      }

      yield* tryPromise(() => output.finalize());

      if (target.buffer === null)
        return yield* Effect.fail(encoderError("mediabunny did not produce an output buffer"));

      return new Uint8Array(target.buffer);
    });
  };

  const writeVideo = <E, R>(
    frames: Stream.Stream<Bitmap, E, R>,
    source: VideoSampleSource,
    size: Size,
    framerate: number,
  ): Effect.Effect<void, E | Encoder.EncoderError, R> => {
    let frameIndex = 0;
    const duration = 1 / framerate;

    return Stream.runForEach(frames, (frame) => {
      const timestamp = frameIndex / framerate;
      frameIndex += 1;

      return tryPromise(async () => {
        const sample = new VideoSample(bitmapToRgbaBytes(frame, size), {
          format: "RGBA",
          codedWidth: size[0],
          codedHeight: size[1],
          timestamp,
          duration,
        });

        try {
          await source.add(sample);
        } finally {
          sample.close();
        }
      });
    });
  };

  const writeAudio = <E, R>(
    chunks: Stream.Stream<AudioBuffer, E, R>,
    source: AudioSampleSource,
  ): Effect.Effect<void, E | Encoder.EncoderError, R> => {
    let timestamp = 0;

    return Stream.runForEach(chunks, (chunk) => {
      const samples = getAudioSampleCount(chunk);
      const currentTimestamp = timestamp;
      timestamp += samples / chunk.samplerate;

      return tryPromise(async () => {
        const sample = new AudioSample({
          data: audioToPlanarF32Bytes(chunk, samples),
          format: "f32-planar",
          numberOfChannels: chunk.channels.length,
          sampleRate: chunk.samplerate,
          timestamp: currentTimestamp,
        });

        try {
          await source.add(sample);
        } finally {
          sample.close();
        }
      });
    });
  };

  const resolveVideoConfig = (
    format: OutputFormat,
    encodeOptions: Encoder.Options,
    options: VideoOptions | undefined,
  ): Effect.Effect<VideoEncodingConfig | undefined, Encoder.EncoderError> => {
    const supportedCodecs = format.getSupportedVideoCodecs();
    const codec = resolveCodec(encodeOptions.video?.codec, options?.codec, defaultVideoCodec(format), supportedCodecs);

    if (codec === undefined) {
      return encodeOptions.video?.codec === undefined && options?.codec === undefined
        ? Effect.succeed(undefined)
        : Effect.fail(encoderError(`unsupported video codec: ${encodeOptions.video?.codec ?? options?.codec}`));
    }

    return Effect.succeed({
      ...options,
      codec,
      bitrate: encodeOptions.video?.bitrate ?? options?.bitrate ?? QUALITY_HIGH,
    });
  };

  const resolveAudioConfig = (
    format: OutputFormat,
    encodeOptions: Encoder.Options,
    options: AudioOptions | undefined,
  ): Effect.Effect<AudioEncodingConfig | undefined, Encoder.EncoderError> => {
    const supportedCodecs = format.getSupportedAudioCodecs();
    const codec = resolveCodec(encodeOptions.audio?.codec, options?.codec, defaultAudioCodec(format), supportedCodecs);

    if (codec === undefined) {
      return encodeOptions.audio?.codec === undefined && options?.codec === undefined
        ? Effect.succeed(undefined)
        : Effect.fail(encoderError(`unsupported audio codec: ${encodeOptions.audio?.codec ?? options?.codec}`));
    }

    return Effect.succeed({
      ...options,
      codec,
      bitrate: encodeOptions.audio?.bitrate ?? options?.bitrate ?? QUALITY_HIGH,
    });
  };

  const resolveCodec = <Codec extends string>(
    requested: string | undefined,
    configured: Codec | undefined,
    preferred: Codec | undefined,
    supported: readonly Codec[],
  ): Codec | undefined => {
    if (requested !== undefined) return supported.includes(requested as Codec) ? (requested as Codec) : undefined;
    if (configured !== undefined) return supported.includes(configured) ? configured : undefined;
    if (preferred !== undefined && supported.includes(preferred)) return preferred;

    return supported[0];
  };

  const defaultVideoCodec = (format: OutputFormat): VideoCodec | undefined => {
    switch (format.fileExtension) {
      case ".webm":
      case ".mkv":
        return "vp9";
      case ".mp4":
      case ".mov":
      case ".ts":
        return "avc";
      default:
        return undefined;
    }
  };

  const defaultAudioCodec = (format: OutputFormat): AudioCodec | undefined => {
    switch (format.fileExtension) {
      case ".wav":
        return "pcm-s16";
      case ".mp3":
        return "mp3";
      case ".flac":
        return "flac";
      case ".aac":
        return "aac";
      case ".webm":
      case ".mkv":
      case ".ogg":
        return "opus";
      case ".mp4":
      case ".mov":
      case ".ts":
        return "aac";
      default:
        return undefined;
    }
  };

  const builtInFormats: Readonly<Record<string, FormatFactory>> = {
    aac: () => new AdtsOutputFormat(),
    adts: () => new AdtsOutputFormat(),
    flac: () => new FlacOutputFormat(),
    matroska: () => new MkvOutputFormat(),
    mkv: () => new MkvOutputFormat(),
    mov: () => new MovOutputFormat(),
    mp3: () => new Mp3OutputFormat(),
    mp4: () => new Mp4OutputFormat(),
    mpegts: () => new MpegTsOutputFormat(),
    ogg: () => new OggOutputFormat(),
    ts: () => new MpegTsOutputFormat(),
    wav: () => new WavOutputFormat(),
    wave: () => new WavOutputFormat(),
    webm: () => new WebMOutputFormat(),
  };

  const getFormatFactory = (container: string, options: Options): FormatFactory | undefined => {
    const normalized = normalizeContainer(container);

    return options.formats?.[container] ?? options.formats?.[normalized] ?? builtInFormats[normalized];
  };

  const getMimeType = (formatFactory: FormatFactory | undefined): string => {
    if (formatFactory === undefined) return "application/octet-stream";

    try {
      return formatFactory().mimeType;
    } catch {
      return "application/octet-stream";
    }
  };

  const normalizeContainer = (container: string): string =>
    container.toLowerCase().replace(/^\./, "").replace(/[-_]/g, "");

  const bitmapToRgbaBytes = (bitmap: Bitmap, [width, height]: Size): Uint8Array => {
    const data = new Uint8Array(width * height * 4);
    let offset = 0;

    for (let y = 0; y < height; y++) {
      const row = bitmap[y];
      for (let x = 0; x < width; x++) {
        const pixel = row?.[x];
        data[offset++] = clampByte(pixel?.[0] ?? 0);
        data[offset++] = clampByte(pixel?.[1] ?? 0);
        data[offset++] = clampByte(pixel?.[2] ?? 0);
        data[offset++] = clampByte(pixel?.[3] ?? 0);
      }
    }

    return data;
  };

  const audioToPlanarF32Bytes = (audio: AudioBuffer, samples: number): Uint8Array => {
    const floats = new Float32Array(samples * audio.channels.length);

    for (let channelIndex = 0; channelIndex < audio.channels.length; channelIndex++) {
      const channel = audio.channels[channelIndex];
      const offset = channelIndex * samples;

      for (let sampleIndex = 0; sampleIndex < samples; sampleIndex++) {
        floats[offset + sampleIndex] = channel?.[sampleIndex] ?? 0;
      }
    }

    return new Uint8Array(floats.buffer);
  };

  const getAudioSampleCount = (audio: AudioBuffer): number =>
    audio.channels.reduce((samples, channel) => Math.max(samples, channel.length), 0);

  const clampByte = (value: number): number => {
    if (value <= 0) return 0;
    if (value >= 255) return 255;

    return Math.round(value);
  };

  const tryPromise = <A>(try_: () => Promise<A>): Effect.Effect<A, Encoder.EncoderError> =>
    Effect.tryPromise({
      try: try_,
      catch: (reason) => encoderError(reason),
    });

  const trySync = <A>(try_: () => A): Effect.Effect<A, Encoder.EncoderError> =>
    Effect.try({
      try: try_,
      catch: (reason) => encoderError(reason),
    });

  const encoderError = (reason?: unknown): Encoder.EncoderError => new Encoder.EncoderError({ reason });
}
