import { Context, Data, Effect, Stream } from "effect";
import { Effectable } from "@veya/core";
import type { Bitmap, FrameCount, Size } from "@veya/core";
import type { VideoClip } from "@veya/core";
import { VideoFrame } from "./VideoFrame";
import { VideoProbe } from "./VideoProbe";

export namespace Video {
  export type MediaSource<E = never, R = never> = VideoProbe.MediaSource<E, R>;

  export type Playback = "clip" | "loop" | "freeze";

  export class VideoSourceError extends Data.TaggedError("VideoSourceError")<{
    readonly reason?: unknown;
  }> {}

  export interface DecodeOptions {
    readonly size?: Size;
    readonly framerate?: number;
    readonly offset?: VideoFrame.Index;
    readonly frames?: FrameCount;
    readonly playback?: Playback;
    readonly speed?: number;
  }

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
    SourceR | R | Service | VideoProbe.Service
  > {
    readonly source: Effectable<MediaSource<SourceE, SourceR>, E, R>;
    readonly size?: Effectable<Size, E, R>;
    readonly framerate?: Effectable<number, E, R>;
    readonly offset?: Effectable<VideoFrame.Input, E, R>;
    readonly duration?: Effectable<VideoFrame.Input, E, R>;
    readonly playback?: Effectable<Playback, E, R>;
    readonly speed?: Effectable<number, E, R>;
  }

  export interface VideoSource {
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: DecodeOptions,
    ) => Stream.Stream<Bitmap, SourceE | VideoSourceError, SourceR>;
  }

  export class Service extends Context.Service<Service, VideoSource>()("@veya/source-video/Video/Service") {}

  export const make = <SourceE = never, SourceR = never, E = never, R = never>(
    source: Effectable<MediaSource<SourceE, SourceR>, E, R>,
    options: Effectable<Options<E, R>, E, R> = {},
  ): Video<SourceE, SourceR, E, R> => {
    const immediateOptions = Effect.isEffect(options) ? undefined : options;

    return {
      source,
      size: immediateOptions?.size,
      framerate: immediateOptions?.framerate,
      offset: immediateOptions?.offset,
      duration: immediateOptions?.duration,
      playback: immediateOptions?.playback,
      speed: immediateOptions?.speed,
      render: Stream.unwrap(
        Service.use(({ decode }) =>
          Effect.gen(function* () {
            const resolvedSource = yield* Effectable.resolve(source);
            const resolvedOptions = yield* Effectable.resolve(options);
            const decodeOptions = yield* resolveDecodeOptions(resolvedSource, resolvedOptions);

            return decode(resolvedSource, decodeOptions);
          }),
        ),
      ),
    };
  };

  const resolveDecodeOptions = <SourceE, SourceR, E, R>(
    source: MediaSource<SourceE, SourceR>,
    options: Options<E, R>,
  ): Effect.Effect<
    DecodeOptions,
    SourceE | E | VideoProbe.VideoProbeError | VideoFrame.VideoFrameError,
    SourceR | R | VideoProbe.Service
  > => {
    return Effect.gen(function* () {
      const size = options.size === undefined ? undefined : yield* Effectable.resolve(options.size);
      const offsetInput = options.offset === undefined ? undefined : yield* Effectable.resolve(options.offset);
      const durationInput = options.duration === undefined ? undefined : yield* Effectable.resolve(options.duration);
      const explicitFramerate =
        options.framerate === undefined ? undefined : yield* Effectable.resolve(options.framerate);
      const framerate = yield* VideoFrame.resolveFramerate([offsetInput, durationInput], {
        source,
        framerate: explicitFramerate,
      });
      const offset =
        offsetInput === undefined ? undefined : yield* VideoFrame.resolveOffset(offsetInput, { framerate });
      const frames =
        durationInput === undefined ? undefined : yield* VideoFrame.resolveDuration(durationInput, { framerate });
      const playback = options.playback === undefined ? undefined : yield* Effectable.resolve(options.playback);
      const speed = options.speed === undefined ? undefined : yield* Effectable.resolve(options.speed);

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
