import { Effect, pipe, Stream } from "effect";

import type { Size } from "@veya/core";
import type { VideoClip } from "@veya/core";

import { VideoDecoder } from "./VideoDecoder";
import { VideoMetadata } from "./VideoMetadata";
import { VideoProber } from "./VideoProber";

export namespace Video {
  export type Options<E = never, R = never> = {
    readonly size?: Effect.Effect<Size, E, R>;
    readonly framerate?: Effect.Effect<number, E, R>;
    readonly offset?: Effect.Effect<number, E, R>;
    readonly duration?: Effect.Effect<number, E, R>;
    readonly playback?: Effect.Effect<VideoDecoder.Playback, E, R>;
    readonly speed?: Effect.Effect<number, E, R>;
  };

  export interface Video<E = never, R = never> extends VideoClip.VideoClip<
    E | VideoDecoder.VideoDecoderError | VideoProber.VideoProberError,
    R | VideoDecoder | VideoProber
  > {}

  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: VideoDecoder.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Video<SE | OE, SR | Exclude<OR, VideoMetadata>> => {
    return Stream.unwrap(
      Effect.gen(function* () {
        const { probe } = yield* VideoProber;
        const { decode } = yield* VideoDecoder;

        return decode(
          source,
          yield* pipe(
            Effect.all(options, { concurrency: "unbounded" }),
            Effect.provideServiceEffect(VideoMetadata, probe(source)),
          ),
        );
      }),
    );
  };
}
