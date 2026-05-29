import { Effect, Stream } from "effect";
import { Mp4OutputFormat, QUALITY_HIGH, VideoSample, VideoSampleSource } from "mediabunny";
import type { OutputFormat, VideoEncodingConfig, VideoTrackMetadata } from "mediabunny";

import { type VideoClip, VideoContext } from "@veya/core";

import { MediabunnyEncoding } from "./MediabunnyEncoding";
import { MediabunnyMultiplexer } from "./MediabunnyMultiplexer";

export namespace MediabunnyVideoEncoder {
  export interface Options {
    /** Video codec configuration passed to `VideoSampleSource`. */
    readonly encoding?: VideoEncodingConfig | undefined;
    /** Container/output format. Defaults to MP4. */
    readonly format?: OutputFormat | undefined;
    /** Optional video track metadata passed to Mediabunny. */
    readonly track?: VideoTrackMetadata | undefined;
  }

  export const encode = <E = never, R = never>(
    encodable: VideoClip.Encodable<E, R>,
    options: Options = {},
  ): Effect.Effect<MediabunnyEncoding.Result, E | MediabunnyEncoding.Error, R | VideoContext> =>
    Effect.gen(function* () {
      const { framerate, size } = yield* VideoContext;
      const format = options.format ?? new Mp4OutputFormat();
      const encoding = options.encoding ?? defaultEncoding;
      const source = new VideoSampleSource(encoding);

      if (!Number.isFinite(framerate) || framerate <= 0) {
        return yield* new MediabunnyEncoding.Error({
          reason: new MediabunnyEncoding.Error.InvalidVideoFrame({
            message: `Video framerate must be positive, got ${framerate}.`,
          }),
        });
      }

      return yield* MediabunnyMultiplexer.multiplex({
        format,
        setup: ({ output }) => {
          output.addVideoTrack(source, {
            ...options.track,
            frameRate: options.track?.frameRate ?? framerate,
          });
        },
        write: () =>
          Effect.gen(function* () {
            let frame = 0;

            yield* Stream.runForEach(encodable, (bitmap) =>
              Effect.tryPromise({
                try: async () => {
                  const sample = bitmapToSample(bitmap, {
                    duration: 1 / framerate,
                    size,
                    timestamp: frame / framerate,
                  });
                  frame += 1;

                  try {
                    await source.add(sample);
                  } finally {
                    sample.close();
                  }
                },
                catch: (cause) => MediabunnyEncoding.toEncodeFailed(cause),
              }),
            );
          }),
      });
    });

  const defaultEncoding: VideoEncodingConfig = {
    codec: "avc",
    bitrate: QUALITY_HIGH,
    keyFrameInterval: 2,
    alpha: "discard",
  };

  const bitmapToSample = (
    bitmap: VideoClip.Bitmap,
    options: {
      readonly duration: number;
      readonly size: readonly [width: number, height: number];
      readonly timestamp: number;
    },
  ): VideoSample => {
    const [width, height] = options.size;

    if (width <= 0 || height <= 0) {
      throw new MediabunnyEncoding.Error({
        reason: new MediabunnyEncoding.Error.InvalidVideoFrame({
          message: `Video frame size must be positive, got ${width}x${height}.`,
        }),
      });
    }

    const data = new Uint8Array(width * height * 4);
    let offset = 0;

    for (let y = 0; y < height; y += 1) {
      const row = bitmap[y];

      for (let x = 0; x < width; x += 1) {
        const pixel = row?.[x] ?? [0, 0, 0, 0];

        data[offset + 0] = toByte(pixel[0]);
        data[offset + 1] = toByte(pixel[1]);
        data[offset + 2] = toByte(pixel[2]);
        data[offset + 3] = toAlphaByte(pixel[3]);
        offset += 4;
      }
    }

    return new VideoSample(data, {
      format: "RGBA",
      codedWidth: width,
      codedHeight: height,
      timestamp: options.timestamp,
      duration: options.duration,
    });
  };

  const toByte = (value: number): number => Math.round(clamp(finiteOr(value, 0), 0, 255));

  const toAlphaByte = (value: number): number => {
    const alpha = finiteOr(value, 0);

    return toByte(alpha <= 1 ? alpha * 255 : alpha);
  };

  const finiteOr = (value: number, fallback: number): number => (Number.isFinite(value) ? value : fallback);

  const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
}
