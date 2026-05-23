import { Array, Context, Data, Effect, Schedule, Stream, pipe } from "effect";
import type { AudioBuffer, Bitmap, ChannelCount, FrameCount, SampleCount, SampleRate, Size } from "./types";

export * from "./types";

export namespace VideoClip {
  export interface VideoClip<E = never, R = never> {
    readonly render: Render<E, R>;
  }

  export type Render<E, R> = Stream.Stream<Bitmap, E, R>;

  export const make = <A, E = never, R = never>(element: VideoClip<E, R> & A) => element;
}

export namespace AudioClip {
  export interface AudioClip<E = never, R = never> {
    readonly render: Render<E, R>;
  }

  export type Render<E, R> = Stream.Stream<AudioBuffer, E, R>;

  export const make = <A, E = never, R = never>(element: AudioClip<E, R> & A) => element;
}

export namespace Gap {
  export interface Gap extends VideoClip.VideoClip<never, never> {}

  export const make = (duration: FrameCount): Gap => {
    return {
      render: Stream.repeat(Stream.make([]), Schedule.recurs(duration)),
    };
  };
}

export namespace Compositor {
  export class CompositorError extends Data.TaggedError("CompositorError")<{}> {}

  export interface VideoCompositeOptions {
    readonly size: Size;
  }

  export interface AudioMixOptions {
    readonly sampleRate: SampleRate;
    readonly channels: ChannelCount;
  }

  export interface Compositor {
    readonly compositeVideo: (
      frames: readonly Bitmap[],
      options: VideoCompositeOptions,
    ) => Effect.Effect<Bitmap, CompositorError>;
    readonly mixAudio: (
      buffers: readonly AudioBuffer[],
      options: AudioMixOptions,
    ) => Effect.Effect<AudioBuffer, CompositorError>;
  }

  export class Service extends Context.Service<Service, Compositor>()("@veya/core/index/Compositor/Service") {}
}

export namespace Composite {
  export interface Composite<E = never, R = never> {
    readonly video: Video<E, R>;
    readonly audio: Audio<E, R>;
  }

  export interface Video<E = never, R = never> extends VideoClip.VideoClip<E, R> {
    readonly size: Size;
    readonly framerate: number;
  }

  export interface Audio<E = never, R = never> extends AudioClip.AudioClip<E, R> {
    readonly sampleRate: SampleRate;
    readonly channels: ChannelCount;
  }

  export interface VideoOptions<Tracks extends readonly VideoTrack.VideoTrack<E, R>[], E = never, R = never> {
    readonly size: Size;
    readonly framerate: number;
    readonly tracks: Tracks;
  }

  export interface AudioOptions<Tracks extends readonly AudioTrack.AudioTrack<E, R>[], E = never, R = never> {
    readonly sampleRate: SampleRate;
    readonly channels: ChannelCount;
    readonly tracks: Tracks;
  }

  export interface Options<
    VideoTracks extends readonly VideoTrack.VideoTrack<E, R>[],
    AudioTracks extends readonly AudioTrack.AudioTrack<E, R>[],
    E = never,
    R = never,
  > {
    readonly video: VideoOptions<VideoTracks, E, R>;
    readonly audio: AudioOptions<AudioTracks, E, R>;
  }

  export const make = <
    VideoTracks extends readonly VideoTrack.VideoTrack<E, R>[],
    AudioTracks extends readonly AudioTrack.AudioTrack<E, R>[],
    E = never,
    R = never,
  >({
    video,
    audio,
  }: Options<VideoTracks, AudioTracks, E, R>): Composite<E | Compositor.CompositorError, R | Compositor.Service> => {
    return {
      video: {
        size: video.size,
        framerate: video.framerate,
        render: pipe(
          video.tracks,
          ([head, ...tail]) => {
            if (!head) return Stream.empty;

            return Array.reduce(
              tail,
              Stream.map(head.render, (frame) => [frame]),
              (a, c) => Stream.zipWith(a, c.render, (frames, frame) => Array.append(frames, frame)),
            );
          },
          Stream.mapEffect((frames) =>
            Compositor.Service.use(({ compositeVideo }) => compositeVideo(frames, { size: video.size })),
          ),
        ),
      },
      audio: {
        sampleRate: audio.sampleRate,
        channels: audio.channels,
        render: pipe(
          audio.tracks,
          ([head, ...tail]) => {
            if (!head) return Stream.empty;

            return Array.reduce(
              tail,
              Stream.map(head.render, (buffer) => [buffer]),
              (a, c) => Stream.zipWith(a, c.render, (buffers, buffer) => Array.append(buffers, buffer)),
            );
          },
          Stream.mapEffect((buffers) =>
            Compositor.Service.use(({ mixAudio }) =>
              mixAudio(buffers, { sampleRate: audio.sampleRate, channels: audio.channels }),
            ),
          ),
        ),
      },
    };
  };
}

export namespace Encoder {
  export class EncoderError extends Data.TaggedError("EncoderError")<{}> {}

  export interface VideoOptions {
    readonly codec?: string;
    readonly bitrate?: number;
  }

  export interface AudioOptions {
    readonly codec?: string;
    readonly bitrate?: number;
  }

  export interface Options {
    readonly container: string;
    readonly filename?: string;
    readonly video?: VideoOptions;
    readonly audio?: AudioOptions;
  }

  export interface EncodedFile<E = never, R = never> {
    readonly filename?: string;
    readonly mimeType: string;
    readonly data: Stream.Stream<Uint8Array, E, R>;
  }

  export interface Encoder {
    readonly encode: <E = never, R = never>(
      composite: Composite.Composite<E, R>,
      options: Options,
    ) => EncodedFile<E | EncoderError, R>;
  }

  export class Service extends Context.Service<Service, Encoder>()("@veya/core/index/Encoder/Service") {}
}

export namespace VideoTrack {
  export interface VideoTrack<E = never, R = never> extends VideoClip.VideoClip<E, R> {}

  export const make = <Clips extends readonly VideoClip.VideoClip<E, R>[], E = never, R = never>(
    clips: Clips,
  ): VideoTrack<E, R> => {
    if (Array.isReadonlyArrayEmpty(clips))
      return {
        render: Stream.empty,
      };

    return {
      render: pipe(
        clips,
        Array.map((c) => c.render),
        Array.reduce(Stream.empty as Stream.Stream<Bitmap, E, R>, (a, c) => Stream.concat(a, c)),
      ),
    };
  };
}

export namespace Silence {
  export interface Silence extends AudioClip.AudioClip<never, never> {}

  export const make = ({
    sampleRate,
    channels,
    samples,
  }: {
    readonly sampleRate: SampleRate;
    readonly channels: ChannelCount;
    readonly samples: SampleCount;
  }): Silence => {
    return {
      render: Stream.make({
        sampleRate,
        channels: globalThis.Array.from({ length: channels }, () => new Float32Array(samples)),
      }),
    };
  };
}

export namespace AudioTrack {
  export interface AudioTrack<E = never, R = never> extends AudioClip.AudioClip<E, R> {}

  export const make = <Clips extends readonly AudioClip.AudioClip<E, R>[], E = never, R = never>(
    clips: Clips,
  ): AudioTrack<E, R> => {
    if (Array.isReadonlyArrayEmpty(clips))
      return {
        render: Stream.empty,
      };

    return {
      render: pipe(
        clips,
        Array.map((c) => c.render),
        Array.reduce(Stream.empty as Stream.Stream<AudioBuffer, E, R>, (a, c) => Stream.concat(a, c)),
      ),
    };
  };
}
