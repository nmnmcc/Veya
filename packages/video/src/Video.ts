import { Effect, pipe, Stream } from "effect";

import { Effectable, type Size, type VideoClip, VideoColorSpace, VideoContext } from "@veya/core";

import { VideoColorSpaceConverter } from "./VideoColorSpaceConverter";
import { VideoDecoder } from "./VideoDecoder";
import { VideoMetadata } from "./VideoMetadata";
import { VideoProber } from "./VideoProber";
import { VideoResampler } from "./VideoResampler";

export namespace Video {
  export type Options<E = never, R = never> = {
    readonly size?: Effectable<Size, E, R> | undefined;
    readonly offset?: Effectable<number, E, R> | undefined;
    readonly duration?: Effectable<number, E, R> | undefined;
    readonly playback?: Effectable<VideoDecoder.Playback, E, R> | undefined;
    readonly speed?: Effectable<number, E, R> | undefined;
    readonly colorSpace?: Effectable<VideoColorSpace.VideoColorSpace, E, R> | undefined;
  };

  export interface Video<E = never, R = never> extends VideoClip.VideoClip<
    E | VideoDecoder.VideoDecoderError | VideoProber.VideoProberError | VideoResampler.VideoResamplerError,
    R | VideoContext | VideoDecoder | VideoColorSpaceConverter | VideoProber | VideoResampler
  > {}

  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: VideoDecoder.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Video<SE | OE, SR | Exclude<OR, VideoMetadata>> => {
    return Stream.unwrap(
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

        return resample(decoded, {
          source: sourceFramerate,
          target: framerate,
        });
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
