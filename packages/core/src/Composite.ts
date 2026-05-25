import { Array, Effect, Stream, pipe } from "effect";
import type { AudioBuffer, Bitmap, ChannelCount, Samplerate, Size } from "./media";
import type { AudioClip } from "./AudioClip";
import { CompositeAudioContext } from "./CompositeAudioContext";
import { CompositeVideoContext } from "./CompositeVideoContext";
import type { AudioTrack } from "./AudioTrack";
import { Compositor } from "./Compositor";
import { Effectable } from "./Effectable";
import type { VideoClip } from "./VideoClip";
import type { VideoTrack } from "./VideoTrack";

export namespace Composite {
  export interface Composite<VideoE = never, VideoR = never, AudioE = VideoE, AudioR = VideoR> {
    readonly video: Video<VideoE, VideoR>;
    readonly audio: Audio<AudioE, AudioR>;
  }

  export interface Video<E = never, R = never> extends VideoClip.VideoClip<E, R> {
    readonly size: Effectable<Size, E, R>;
    readonly framerate: Effectable<number, E, R>;
  }

  export interface Audio<E = never, R = never> extends AudioClip.AudioClip<E, R> {
    readonly samplerate: Effectable<Samplerate, E, R>;
    readonly channels: Effectable<ChannelCount, E, R>;
  }

  type AnyVideoTrack = VideoTrack.VideoTrack<any, any>;
  type AnyAudioTrack = AudioTrack.AudioTrack<any, any>;
  type VideoTrackError<Tracks extends readonly AnyVideoTrack[]> =
    Tracks[number] extends VideoTrack.VideoTrack<infer E, any> ? E : never;
  type VideoTrackContext<Tracks extends readonly AnyVideoTrack[]> =
    Tracks[number] extends VideoTrack.VideoTrack<any, infer R> ? R : never;
  type AudioTrackError<Tracks extends readonly AnyAudioTrack[]> =
    Tracks[number] extends AudioTrack.AudioTrack<infer E, any> ? E : never;
  type AudioTrackContext<Tracks extends readonly AnyAudioTrack[]> =
    Tracks[number] extends AudioTrack.AudioTrack<any, infer R> ? R : never;

  export interface VideoOptions<Tracks extends readonly AnyVideoTrack[], E = never, R = never> {
    readonly size: Effectable<Size, E, R>;
    readonly framerate: Effectable<number, E, R>;
    readonly tracks: Effectable<Tracks, E, R>;
  }

  export interface AudioOptions<Tracks extends readonly AnyAudioTrack[], E = never, R = never> {
    readonly samplerate: Effectable<Samplerate, E, R>;
    readonly channels: Effectable<ChannelCount, E, R>;
    readonly tracks: Effectable<Tracks, E, R>;
  }

  export interface Options<
    VideoTracks extends readonly AnyVideoTrack[],
    AudioTracks extends readonly AnyAudioTrack[],
    E = never,
    R = never,
  > {
    readonly video: VideoOptions<VideoTracks, E, R>;
    readonly audio: AudioOptions<AudioTracks, E, R>;
  }

  export const make = <
    VideoTracks extends readonly AnyVideoTrack[],
    AudioTracks extends readonly AnyAudioTrack[],
    E = never,
    R = never,
  >(
    options: Effectable<Options<VideoTracks, AudioTracks, E, R>, E, R>,
  ): Composite<
    E | VideoTrackError<VideoTracks> | Compositor.CompositorError,
    R | Exclude<VideoTrackContext<VideoTracks>, CompositeVideoContext> | Compositor,
    E | AudioTrackError<AudioTracks> | Compositor.CompositorError,
    R | Exclude<AudioTrackContext<AudioTracks>, CompositeAudioContext> | Compositor
  > => {
    return {
      video: {
        size: Effect.flatMap(Effectable.resolve(options), ({ video }) => Effectable.resolve(video.size)),
        framerate: Effect.flatMap(Effectable.resolve(options), ({ video }) => Effectable.resolve(video.framerate)),
        render: Stream.unwrap(Effect.map(resolveVideoOptions(options), renderVideo)),
      },
      audio: {
        samplerate: Effect.flatMap(Effectable.resolve(options), ({ audio }) => Effectable.resolve(audio.samplerate)),
        channels: Effect.flatMap(Effectable.resolve(options), ({ audio }) => Effectable.resolve(audio.channels)),
        render: Stream.unwrap(Effect.map(resolveAudioOptions(options), renderAudio)),
      },
    };
  };

  interface ResolvedVideoOptions<Tracks extends readonly AnyVideoTrack[]> {
    readonly size: Size;
    readonly framerate: number;
    readonly tracks: Tracks;
  }

  interface ResolvedAudioOptions<Tracks extends readonly AnyAudioTrack[]> {
    readonly samplerate: Samplerate;
    readonly channels: ChannelCount;
    readonly tracks: Tracks;
  }

  const resolveVideoOptions = <Tracks extends readonly AnyVideoTrack[], E, R>(
    options: Effectable<Options<Tracks, readonly AnyAudioTrack[], E, R>, E, R>,
  ): Effect.Effect<ResolvedVideoOptions<Tracks>, E, R> => {
    return Effect.gen(function* () {
      const { video } = yield* Effectable.resolve(options);

      const { size, framerate } = yield* Effectable.all({
        size: video.size,
        framerate: video.framerate,
      });
      const tracks = yield* Effectable.resolve<Tracks, E, R>(video.tracks);

      return { size, framerate, tracks };
    });
  };

  const resolveAudioOptions = <Tracks extends readonly AnyAudioTrack[], E, R>(
    options: Effectable<Options<readonly AnyVideoTrack[], Tracks, E, R>, E, R>,
  ): Effect.Effect<ResolvedAudioOptions<Tracks>, E, R> => {
    return Effect.gen(function* () {
      const { audio } = yield* Effectable.resolve(options);

      const { samplerate, channels } = yield* Effectable.all({
        samplerate: audio.samplerate,
        channels: audio.channels,
      });
      const tracks = yield* Effectable.resolve<Tracks, E, R>(audio.tracks);

      return { samplerate, channels, tracks };
    });
  };

  const renderVideo = <E, R>({
    framerate,
    size,
    tracks,
  }: ResolvedVideoOptions<readonly VideoTrack.VideoTrack<E, R>[]>): Stream.Stream<
    Bitmap,
    E | Compositor.CompositorError,
    Exclude<R, CompositeVideoContext> | Compositor
  > => {
    return pipe(
      tracks,
      ([head, ...tail]) => {
        if (!head) return Stream.empty;

        return Array.reduce(
          tail,
          Stream.map(head.render, (frame) => [frame]),
          (a, c) => Stream.zipWith(a, c.render, (frames, frame) => Array.append(frames, frame)),
        );
      },
      Stream.provideService(CompositeVideoContext, { size, framerate }),
      Stream.mapEffect((frames) => Compositor.use(({ compositeVideo }) => compositeVideo(frames, { size }))),
    );
  };

  const renderAudio = <E, R>({
    samplerate,
    channels,
    tracks,
  }: ResolvedAudioOptions<readonly AudioTrack.AudioTrack<E, R>[]>): Stream.Stream<
    AudioBuffer,
    E | Compositor.CompositorError,
    Exclude<R, CompositeAudioContext> | Compositor
  > => {
    return pipe(
      tracks,
      ([head, ...tail]) => {
        if (!head) return Stream.empty;

        return Array.reduce(
          tail,
          Stream.map(head.render, (buffer) => [buffer]),
          (a, c) => Stream.zipWith(a, c.render, (buffers, buffer) => Array.append(buffers, buffer)),
        );
      },
      Stream.provideService(CompositeAudioContext, { samplerate, channels }),
      Stream.mapEffect((buffers) => Compositor.use(({ mixAudio }) => mixAudio(buffers, { samplerate, channels }))),
    );
  };
}
