import { Effect, pipe, Stream } from "effect";
import type { Size } from "@veya/core";
import type { VideoClip } from "@veya/core";
import { VideoProbe } from "./VideoProbe";
import { VideoSource } from "./VideoSource";
import { VideoMetadata } from "./VideoMetadata";

export namespace Video {
  export type Options<E = never, R = never> = {
    readonly size?: Effect.Effect<Size, E, R>;
    readonly framerate?: Effect.Effect<number, E, R>;
    readonly offset?: Effect.Effect<number, E, R>;
    readonly duration?: Effect.Effect<number, E, R>;
    readonly playback?: Effect.Effect<VideoSource.Playback, E, R>;
    readonly speed?: Effect.Effect<number, E, R>;
  };

  export interface Video<E = never, R = never> extends VideoClip.VideoClip<
    E | VideoSource.VideoSourceError | VideoProbe.VideoProbeError,
    R | VideoSource | VideoProbe
  > {}

  export const make = <SE = never, SR = never, OE = never, OR = never>(
    source: VideoSource.MediaSource<SE, SR>,
    options: Options<OE, OR> = {},
  ): Video<SE | OE, SR | Exclude<OR, VideoMetadata>> => {
    return Stream.unwrap(
      Effect.gen(function* () {
        const { probe } = yield* VideoProbe;
        const { decode } = yield* VideoSource;

        return decode(
          source,
          yield* pipe(
            Effect.gen(function* () {
              const { duration, ...decodeOptions } = yield* Effect.all(options, { concurrency: "unbounded" });

              return {
                ...decodeOptions,
                frames: duration,
              };
            }),
            Effect.provideService(VideoMetadata, yield* probe(source)),
          ),
        );
      }),
    );
  };
}
