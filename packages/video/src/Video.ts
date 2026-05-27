import { Effect, pipe, Stream } from "effect";

import { Effectable, type Size, type VideoClip, VideoContext } from "@veya/core";

import { VideoDecoder } from "./VideoDecoder";
import { VideoMetadata } from "./VideoMetadata";
import { VideoProber } from "./VideoProber";
import { VideoResampler } from "./VideoResampler";

export namespace Video {
  export type Options<E = never, R = never> = {
    readonly size?: Effectable<Size, E, R>;
    readonly offset?: Effectable<number, E, R>;
    readonly duration?: Effectable<number, E, R>;
    readonly playback?: Effectable<VideoDecoder.Playback, E, R>;
    readonly speed?: Effectable<number, E, R>;
  };

  export interface Video<E = never, R = never> extends VideoClip.VideoClip<
    E | VideoDecoder.VideoDecoderError | VideoProber.VideoProberError | VideoResampler.VideoResamplerError,
    R | VideoContext | VideoDecoder | VideoProber | VideoResampler
  > {}

  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: VideoDecoder.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Video<SE | OE, SR | Exclude<OR, VideoMetadata>> => {
    return Stream.unwrap(
      Effect.gen(function* () {
        const { probe } = yield* VideoProber;
        const { decode } = yield* VideoDecoder;
        const { framerate } = yield* VideoContext;
        const metadata = yield* probe(source);

        const decoded = decode(
          source,
          yield* pipe(
            Effect.all(Effectable.map(options), { concurrency: "unbounded" }),
            Effect.provideService(VideoMetadata, metadata),
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
}
