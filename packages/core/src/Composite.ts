import { Array, Effect, Stream, pipe } from "effect";
import type { AudioBuffer, Bitmap, ChannelCount, Samplerate, Size } from "./media";
import type { AudioClip } from "./AudioClip";
import { CompositeAudioContext } from "./CompositeAudioContext";
import { CompositeVideoContext } from "./CompositeVideoContext";
import type { AudioTrack } from "./AudioTrack";
import { Compositor } from "./Compositor";
import type { VideoClip } from "./VideoClip";
import type { VideoTrack } from "./VideoTrack";

export namespace Composite {
  export interface Composite<VideoE = never, VideoR = never, AudioE = VideoE, AudioR = VideoR> {
    readonly video: Video<VideoE, VideoR>;
    readonly audio: Audio<AudioE, AudioR>;
  }

  export interface Video<E = never, R = never> extends VideoClip.VideoClip<E, R> {
    readonly size: Effect.Effect<Size, E, R>;
    readonly framerate: Effect.Effect<number, E, R>;
  }

  export interface Audio<E = never, R = never> extends AudioClip.AudioClip<E, R> {
    readonly samplerate: Effect.Effect<Samplerate, E, R>;
    readonly channels: Effect.Effect<ChannelCount, E, R>;
  }

  type AnyVideoTrack = VideoTrack.Any;
  type AnyAudioTrack = AudioTrack.Any;
  type VideoTrackError<Tracks extends readonly AnyVideoTrack[]> =
    Tracks[number] extends Stream.Stream<any, infer E, any> ? E : never;
  type VideoTrackContext<Tracks extends readonly AnyVideoTrack[]> =
    Tracks[number] extends Stream.Stream<any, any, infer R> ? R : never;
  type AudioTrackError<Tracks extends readonly AnyAudioTrack[]> =
    Tracks[number] extends Stream.Stream<any, infer E, any> ? E : never;
  type AudioTrackContext<Tracks extends readonly AnyAudioTrack[]> =
    Tracks[number] extends Stream.Stream<any, any, infer R> ? R : never;

  export type VideoOptions<Tracks extends readonly AnyVideoTrack[], E = never, R = never> = {
    readonly size: Effect.Effect<Size, E, R>;
    readonly framerate: Effect.Effect<number, E, R>;
    readonly tracks: Tracks;
  };

  export type AudioOptions<Tracks extends readonly AnyAudioTrack[], E = never, R = never> = {
    readonly samplerate: Effect.Effect<Samplerate, E, R>;
    readonly channels: Effect.Effect<ChannelCount, E, R>;
    readonly tracks: Tracks;
  };

  export type Options<
    VideoTracks extends readonly AnyVideoTrack[],
    AudioTracks extends readonly AnyAudioTrack[],
    VideoE = never,
    VideoR = never,
    AudioE = never,
    AudioR = never,
  > = {
    readonly video: VideoOptions<VideoTracks, VideoE, VideoR>;
    readonly audio: AudioOptions<AudioTracks, AudioE, AudioR>;
  };

  export const make = <
    VideoTracks extends readonly AnyVideoTrack[],
    AudioTracks extends readonly AnyAudioTrack[],
    VideoE = never,
    VideoR = never,
    AudioE = never,
    AudioR = never,
  >(
    options: Options<VideoTracks, AudioTracks, VideoE, VideoR, AudioE, AudioR>,
  ): Composite<
    VideoE | VideoTrackError<VideoTracks> | Compositor.CompositorError,
    VideoR | Exclude<VideoTrackContext<VideoTracks>, CompositeVideoContext> | Compositor,
    AudioE | AudioTrackError<AudioTracks> | Compositor.CompositorError,
    AudioR | Exclude<AudioTrackContext<AudioTracks>, CompositeAudioContext> | Compositor
  > => {
    const video = Stream.unwrap(
      Effect.map(
        Effect.all(
          {
            size: options.video.size,
            framerate: options.video.framerate,
          },
          { concurrency: "unbounded" },
        ),
        (resolved) =>
          renderVideo({
            ...resolved,
            tracks: options.video.tracks,
          }),
      ),
    );
    const audio = Stream.unwrap(
      Effect.map(
        Effect.all(
          {
            samplerate: options.audio.samplerate,
            channels: options.audio.channels,
          },
          { concurrency: "unbounded" },
        ),
        (resolved) =>
          renderAudio({
            ...resolved,
            tracks: options.audio.tracks,
          }),
      ),
    );

    return {
      video: Object.assign(video, {
        size: options.video.size,
        framerate: options.video.framerate,
      }),
      audio: Object.assign(audio, {
        samplerate: options.audio.samplerate,
        channels: options.audio.channels,
      }),
    };
  };

  type RenderVideoOptions<Tracks extends readonly AnyVideoTrack[]> = {
    readonly size: Size;
    readonly framerate: number;
    readonly tracks: Tracks;
  };

  type RenderAudioOptions<Tracks extends readonly AnyAudioTrack[]> = {
    readonly samplerate: Samplerate;
    readonly channels: ChannelCount;
    readonly tracks: Tracks;
  };

  const renderVideo = <Tracks extends readonly AnyVideoTrack[]>({
    framerate,
    size,
    tracks,
  }: RenderVideoOptions<Tracks>): Stream.Stream<
    Bitmap,
    VideoTrackError<Tracks> | Compositor.CompositorError,
    Exclude<VideoTrackContext<Tracks>, CompositeVideoContext> | Compositor
  > => {
    return pipe(
      tracks,
      ([head, ...tail]) => {
        if (!head) return Stream.empty;

        return Array.reduce(
          tail,
          Stream.map(head, (frame) => [frame]),
          (a, c) => Stream.zipWith(a, c, (frames, frame) => Array.append(frames, frame)),
        );
      },
      Stream.provideService(CompositeVideoContext, { size, framerate }),
      Stream.mapEffect((frames) => Compositor.use(({ compositeVideo }) => compositeVideo(frames, { size }))),
    );
  };

  const renderAudio = <Tracks extends readonly AnyAudioTrack[]>({
    samplerate,
    channels,
    tracks,
  }: RenderAudioOptions<Tracks>): Stream.Stream<
    AudioBuffer,
    AudioTrackError<Tracks> | Compositor.CompositorError,
    Exclude<AudioTrackContext<Tracks>, CompositeAudioContext> | Compositor
  > => {
    return pipe(
      tracks,
      ([head, ...tail]) => {
        if (!head) return Stream.empty;

        return Array.reduce(
          tail,
          Stream.map(head, (buffer) => [buffer]),
          (a, c) => Stream.zipWith(a, c, (buffers, buffer) => Array.append(buffers, buffer)),
        );
      },
      Stream.provideService(CompositeAudioContext, { samplerate, channels }),
      Stream.mapEffect((buffers) => Compositor.use(({ mixAudio }) => mixAudio(buffers, { samplerate, channels }))),
    );
  };
}
