import { Effect, pipe, Stream } from "effect";

import { Effectable, type Size, type VideoClip, VideoColorSpace, VideoContext, type VideoTick } from "@veya/core";

import { VideoColorSpaceConverter } from "./VideoColorSpaceConverter";
import { VideoDecoder } from "./VideoDecoder";
import { VideoMetadata } from "./VideoMetadata";
import { VideoProber } from "./VideoProber";
import { VideoResampler } from "./VideoResampler";

export namespace Video {
  export interface Video<E = never, R = never> extends VideoClip.VideoClip<
    VideoTick,
    never,
    never,
    E | VideoDecoder.Error | VideoProber.Error | VideoResampler.Error,
    R | VideoContext | VideoDecoder | VideoColorSpaceConverter | VideoProber | VideoResampler
  > {}

  export type Options<E = never, R = never> = {
    /** Output frame size in pixels. Defaults to the decoded source size. */
    readonly size?: Effectable<Size, E, R> | undefined;
    /** Start offset in source frames. Use `VideoDuration.make` to convert time into frames. */
    readonly offset?: Effectable<number, E, R> | undefined;
    /** Clip duration in source frames. Use `VideoDuration.make` to convert time into frames. */
    readonly duration?: Effectable<number, E, R> | undefined;
    /** Behavior when playback reaches the end of the source. */
    readonly playback?: Effectable<VideoDecoder.Playback, E, R> | undefined;
    /** Playback speed multiplier. */
    readonly speed?: Effectable<number, E, R> | undefined;
    /** Source color space. Defaults to probed metadata when available. */
    readonly colorSpace?: Effectable<VideoColorSpace.VideoColorSpace, E, R> | undefined;
  };

  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: VideoDecoder.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Video<SE | OE, SR | Exclude<OR, VideoMetadata>> => {
    return (stream) =>
      Stream.unwrap(
        Effect.gen(function* () {
          const { probe } = yield* VideoProber;
          const { decode } = yield* VideoDecoder;
          const { convert } = yield* VideoColorSpaceConverter;
          const { colorSpace, framerate } = yield* VideoContext;
          const metadata = yield* probe(source);

          const decodeOptions = withMetadataColorSpace(
            yield* pipe(
              Effect.all(Effectable.map(options), { concurrency: "unbounded" }),
              Effect.provideService(VideoMetadata, metadata),
            ),
            metadata,
          );

          const decoded = pipe(
            decode(source, decodeOptions),
            Stream.map((bitmap) =>
              convert(bitmap, {
                ...{
                  source: decodeOptions.colorSpace,
                  target: colorSpace,
                },
              }),
            ),
          );

          const sourceFramerate = metadata.framerate;

          if (!sourceFramerate || sourceFramerate === framerate) {
            return decoded;
          }

          const { resample } = yield* VideoResampler;

          return resample(() => decoded, {
            source: sourceFramerate,
            target: framerate,
          })(stream);
        }),
      );
  };

  const withMetadataColorSpace = (
    options: VideoDecoder.Options,
    metadata: VideoMetadata.VideoMetadata,
  ): VideoDecoder.Options => {
    if (options.colorSpace || !metadata.colorSpace) {
      return options;
    }

    return {
      ...options,
      colorSpace: metadata.colorSpace,
    };
  };
}
