import { Effect, Stream } from "effect";
import { Effectable } from "@veya/core";
import type { Size } from "@veya/core";
import type { VideoClip } from "@veya/core";
import { VideoFrame } from "./VideoFrame";
import { VideoProbe } from "./VideoProbe";
import { VideoSource } from "./VideoSource";

export namespace Video {
  export type MediaSource<E = never, R = never> = VideoSource.MediaSource<E, R>;

  export type Service = InstanceType<typeof VideoSource>;

  export type Playback = VideoSource.Playback;

  export const VideoSourceError = VideoSource.VideoSourceError;
  export type VideoSourceError = VideoSource.VideoSourceError;

  export type DecodeOptions = VideoSource.DecodeOptions;

  export interface Options<E = never, R = never> {
    readonly size?: Effectable<Size, E, R>;
    readonly framerate?: Effectable<number, E, R>;
    readonly offset?: Effectable<VideoFrame.Input, E, R>;
    readonly duration?: Effectable<VideoFrame.Input, E, R>;
    readonly playback?: Effectable<Playback, E, R>;
    readonly speed?: Effectable<number, E, R>;
  }

  export interface Video<SourceE = never, SourceR = never, E = never, R = never> extends VideoClip.VideoClip<
    SourceE | E | VideoSourceError | VideoProbe.VideoProbeError | VideoFrame.VideoFrameError,
    SourceR | R | Service | VideoProbe
  > {
    readonly source: Effectable<MediaSource<SourceE, SourceR>, E, R>;
    readonly size?: Effectable<Size, E, R>;
    readonly framerate?: Effectable<number, E, R>;
    readonly offset?: Effectable<VideoFrame.Input, E, R>;
    readonly duration?: Effectable<VideoFrame.Input, E, R>;
    readonly playback?: Effectable<Playback, E, R>;
    readonly speed?: Effectable<number, E, R>;
  }

  export const make = Effect.fn("Video.make")(function* <SourceE = never, SourceR = never, E = never, R = never>(
    source: Effectable<MediaSource<SourceE, SourceR>, E, R>,
    options: Effectable<Options<E, R>, E, R> = {},
  ): Effect.fn.Return<Video<SourceE, SourceR, E, R>, E, R> {
    const [resolvedSource, resolvedOptions] = yield* Effectable.all([source, options] as const);

    return {
      source: resolvedSource,
      size: resolvedOptions.size,
      framerate: resolvedOptions.framerate,
      offset: resolvedOptions.offset,
      duration: resolvedOptions.duration,
      playback: resolvedOptions.playback,
      speed: resolvedOptions.speed,
      render: Stream.unwrap(
        Effect.gen(function* () {
          const { decode } = yield* VideoSource;
          const decodeOptions = yield* resolveDecodeOptions(resolvedSource, resolvedOptions);

          return decode(resolvedSource, decodeOptions);
        }),
      ),
    };
  });

  const resolveDecodeOptions = <SourceE, SourceR, E, R>(
    source: MediaSource<SourceE, SourceR>,
    options: Options<E, R>,
  ): Effect.Effect<
    DecodeOptions,
    SourceE | E | VideoProbe.VideoProbeError | VideoFrame.VideoFrameError,
    SourceR | R | VideoProbe
  > => {
    return Effect.gen(function* () {
      const {
        size,
        offset: offsetInput,
        duration: durationInput,
        framerate: explicitFramerate,
        playback,
        speed,
      } = yield* Effectable.all({
        size: options.size,
        offset: options.offset,
        duration: options.duration,
        framerate: options.framerate,
        playback: options.playback,
        speed: options.speed,
      });
      const framerate = yield* VideoFrame.resolveFramerate([offsetInput, durationInput], {
        source,
        framerate: explicitFramerate,
      });
      const { offset, frames } = yield* Effectable.all({
        offset: offsetInput === undefined ? undefined : VideoFrame.resolveOffset(offsetInput, { framerate }),
        frames: durationInput === undefined ? undefined : VideoFrame.resolveDuration(durationInput, { framerate }),
      });

      return {
        size,
        framerate,
        offset,
        frames,
        playback,
        speed,
      };
    });
  };
}
