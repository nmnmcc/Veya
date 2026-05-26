import { Duration, Effect, Layer, Stream, pipe } from "effect";
import { Encoder } from "@veya/encoder";
import { Compositor, CompositeAudioContext, CompositeVideoContext } from "@veya/core";
import type {
  AudioBuffer,
  Bitmap,
  ChannelCount as ChannelCountType,
  RGBA,
  SampleCount as SampleCountType,
  Samplerate as SamplerateType,
  Size as SizeType,
} from "@veya/core";
import { AudioProbe, AudioSource } from "@veya/audio";
import { ResvgSvg } from "@veya/svg-resvg";
import { VideoProbe, VideoSource } from "@veya/video";

export const sampleSize: SizeType = [8, 6];
export const sampleFramerate = 24;
export const sampleSamplerate: SamplerateType = 48000;
export const sampleChannels: ChannelCountType = 2;
export const sampleMediaBytes = new Uint8Array([0x56, 0x65, 0x79, 0x61]);

const transparent: RGBA = [0, 0, 0, 0];

export const sampleRuntimeLayer = Layer.mergeAll(
  Layer.succeed(CompositeVideoContext, { size: sampleSize, framerate: sampleFramerate }),
  Layer.succeed(CompositeAudioContext, { samplerate: sampleSamplerate, channels: sampleChannels }),
  Layer.succeed(Compositor, {
    compositeVideo: (frames, options) => Effect.succeed(compositeVideo(frames, options.size)),
    mixAudio: (buffers, options) => Effect.succeed(mixAudio(buffers, options.samplerate, options.channels)),
  }),
  Layer.succeed(Encoder, {
    encode: (composite, options) => ({
      filename: options.filename,
      mimeType: options.container === "json" ? "application/json" : `video/${options.container}`,
      data: Stream.unwrap(
        Effect.gen(function* () {
          const videoFrames = yield* Stream.runCount(composite.video);
          const audioChunks = yield* Stream.runCount(composite.audio);
          const bytes = new TextEncoder().encode(
            JSON.stringify(
              {
                filename: options.filename,
                container: options.container,
                video: { frames: videoFrames, options: options.video ?? {} },
                audio: { chunks: audioChunks, options: options.audio ?? {} },
              },
              null,
              2,
            ),
          );

          return Stream.make(bytes);
        }),
      ),
    }),
  }),
  Layer.succeed(VideoProbe, {
    probe: () =>
      Effect.succeed({
        size: sampleSize,
        framerate: sampleFramerate,
        frames: 96,
        duration: Duration.seconds(4),
      }),
  }),
  Layer.succeed(VideoSource, {
    decode: (_source, options) => {
      const size = options.size ?? sampleSize;
      const frames = options.frames ?? 1;
      const start = options.offset ?? 0;

      return pipe(
        Stream.range(0, frames - 1),
        Stream.map((index) => makeIndexedBitmap(size, start + index)),
      );
    },
  }),
  Layer.succeed(AudioProbe, {
    probe: () =>
      Effect.succeed({
        samplerate: sampleSamplerate,
        channels: sampleChannels,
        samples: sampleSamplerate * 4,
        duration: Duration.seconds(4),
      }),
  }),
  Layer.succeed(AudioSource, {
    decode: (_source, options) => {
      const samplerate = options.samplerate ?? sampleSamplerate;
      const channels = options.channels ?? sampleChannels;
      const samples = options.samples ?? Math.round(samplerate / 4);
      const speed = options.speed ?? 1;

      return Stream.make(makeTone(samples, samplerate, channels, 220 * speed));
    },
  }),
  ResvgSvg.layer(),
);

export const runSample = <A, E>(effect: Effect.Effect<A, E, any>): Promise<A> => {
  return Effect.runPromise(Effect.provide(effect, sampleRuntimeLayer) as Effect.Effect<A, E, never>);
};

export const makeBitmap = (size: SizeType, pixel: (x: number, y: number) => RGBA): Bitmap => {
  const [width, height] = size;

  return globalThis.Array.from({ length: height }, (_, y) =>
    globalThis.Array.from({ length: width }, (_, x) => pixel(x, y)),
  );
};

export const mapBitmap = (bitmap: Bitmap, map: (pixel: RGBA, x: number, y: number) => RGBA): Bitmap => {
  return bitmap.map((row, y) => row.map((pixel, x) => map(pixel, x, y)));
};

export const makeTone = (
  samples: SampleCountType,
  samplerate: SamplerateType,
  channels: ChannelCountType,
  frequency: number,
): AudioBuffer => ({
  samplerate,
  channels: globalThis.Array.from({ length: channels }, (_, channel) =>
    Float32Array.from({ length: samples }, (_, sample) => {
      const pan = channel === 0 ? 0.28 : 0.18;
      return Math.sin((sample / samplerate) * Math.PI * 2 * frequency) * pan;
    }),
  ),
});

export const decodeUtf8 = (chunks: readonly Uint8Array[]): string => {
  const size = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const bytes = new Uint8Array(size);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(bytes);
};

const makeIndexedBitmap = (size: SizeType, index: number): Bitmap => {
  return makeBitmap(size, (x, y) => [
    (index * 17 + x * 19) % 256,
    (index * 29 + y * 23) % 256,
    (index * 11 + x * 7 + y * 5) % 256,
    255,
  ]);
};

const compositeVideo = (frames: readonly Bitmap[], size: SizeType): Bitmap => {
  return frames.reduce(
    (bottom, top) => alphaComposite(bottom, top, size),
    makeBitmap(size, () => transparent),
  );
};

const alphaComposite = (bottom: Bitmap, top: Bitmap, size: SizeType): Bitmap => {
  return makeBitmap(size, (x, y) => blend(getPixel(bottom, x, y), getPixel(top, x, y)));
};

const getPixel = (bitmap: Bitmap, x: number, y: number): RGBA => {
  return bitmap[y]?.[x] ?? transparent;
};

const blend = (bottom: RGBA, top: RGBA): RGBA => {
  const topAlpha = top[3] / 255;
  const bottomAlpha = (bottom[3] / 255) * (1 - topAlpha);
  const alpha = topAlpha + bottomAlpha;

  if (alpha === 0) return transparent;

  return [
    Math.round((top[0] * topAlpha + bottom[0] * bottomAlpha) / alpha),
    Math.round((top[1] * topAlpha + bottom[1] * bottomAlpha) / alpha),
    Math.round((top[2] * topAlpha + bottom[2] * bottomAlpha) / alpha),
    Math.round(alpha * 255),
  ];
};

const mixAudio = (
  buffers: readonly AudioBuffer[],
  samplerate: SamplerateType,
  channels: ChannelCountType,
): AudioBuffer => {
  const samples = buffers.reduce((max, buffer) => Math.max(max, buffer.channels[0]?.length ?? 0), 0);

  return {
    samplerate,
    channels: globalThis.Array.from({ length: channels }, (_, channelIndex) => {
      const output = new Float32Array(samples);

      for (const buffer of buffers) {
        const input = buffer.channels[channelIndex] ?? buffer.channels[0];
        if (input === undefined) continue;

        for (let sample = 0; sample < samples; sample++) {
          output[sample] = (output[sample] ?? 0) + (input[sample] ?? 0);
        }
      }

      if (buffers.length > 1) {
        for (let sample = 0; sample < samples; sample++) {
          output[sample] = (output[sample] ?? 0) / buffers.length;
        }
      }

      return output;
    }),
  };
};
