import { Array, Effect, Stream, pipe } from "effect";
import type { AudioBuffer, AudioChunk, Bitmap, ChannelCount, SampleRate, Size } from "./media";
import type { AudioClip } from "./AudioClip";
import type { AudioTrack } from "./AudioTrack";
import { Compositor } from "./Compositor";
import { Effectable } from "./Effectable";
import type { VideoClip } from "./VideoClip";
import type { VideoTrack } from "./VideoTrack";

export namespace Composite {
  export interface Composite<E = never, R = never> {
    readonly video: Video<E, R>;
    readonly audio: Audio<E, R>;
  }

  export interface Video<E = never, R = never> extends VideoClip.VideoClip<E, R> {
    readonly size: Effectable<Size, E, R>;
    readonly framerate: Effectable<number, E, R>;
  }

  export interface Audio<E = never, R = never> extends AudioClip.AudioClip<E, R> {
    readonly sampleRate: Effectable<SampleRate, E, R>;
    readonly channels: Effectable<ChannelCount, E, R>;
  }

  export interface VideoOptions<Tracks extends readonly VideoTrack.VideoTrack<E, R>[], E = never, R = never> {
    readonly size: Effectable<Size, E, R>;
    readonly framerate: Effectable<number, E, R>;
    readonly tracks: Effectable<Tracks, E, R>;
  }

  export interface AudioOptions<Tracks extends readonly AudioTrack.AudioTrack<E, R>[], E = never, R = never> {
    readonly sampleRate: Effectable<SampleRate, E, R>;
    readonly channels: Effectable<ChannelCount, E, R>;
    readonly tracks: Effectable<Tracks, E, R>;
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
  >(
    options: Effectable<Options<VideoTracks, AudioTracks, E, R>, E, R>,
  ): Composite<E | Compositor.CompositorError, R | Compositor.Service> => {
    return {
      video: {
        size: Effect.flatMap(Effectable.resolve(options), ({ video }) => Effectable.resolve(video.size)),
        framerate: Effect.flatMap(Effectable.resolve(options), ({ video }) => Effectable.resolve(video.framerate)),
        render: Stream.unwrap(Effect.map(resolveVideoOptions(options), renderVideo)),
      },
      audio: {
        sampleRate: Effect.flatMap(Effectable.resolve(options), ({ audio }) => Effectable.resolve(audio.sampleRate)),
        channels: Effect.flatMap(Effectable.resolve(options), ({ audio }) => Effectable.resolve(audio.channels)),
        render: Stream.unwrap(Effect.map(resolveAudioOptions(options), renderAudio)),
      },
    };
  };

  interface ResolvedVideoOptions<Tracks extends readonly VideoTrack.VideoTrack<E, R>[], E, R> {
    readonly size: Size;
    readonly framerate: number;
    readonly tracks: Tracks;
  }

  interface ResolvedAudioOptions<Tracks extends readonly AudioTrack.AudioTrack<E, R>[], E, R> {
    readonly sampleRate: SampleRate;
    readonly channels: ChannelCount;
    readonly tracks: Tracks;
  }

  const resolveVideoOptions = <Tracks extends readonly VideoTrack.VideoTrack<E, R>[], E, R>(
    options: Effectable<Options<Tracks, readonly AudioTrack.AudioTrack<E, R>[], E, R>, E, R>,
  ): Effect.Effect<ResolvedVideoOptions<Tracks, E, R>, E, R> => {
    return Effect.gen(function* () {
      const { video } = yield* Effectable.resolve(options);
      const size = yield* Effectable.resolve(video.size);
      const framerate = yield* Effectable.resolve(video.framerate);
      const tracks = yield* Effectable.resolve(video.tracks);

      return { size, framerate, tracks };
    });
  };

  const resolveAudioOptions = <Tracks extends readonly AudioTrack.AudioTrack<E, R>[], E, R>(
    options: Effectable<Options<readonly VideoTrack.VideoTrack<E, R>[], Tracks, E, R>, E, R>,
  ): Effect.Effect<ResolvedAudioOptions<Tracks, E, R>, E, R> => {
    return Effect.gen(function* () {
      const { audio } = yield* Effectable.resolve(options);
      const sampleRate = yield* Effectable.resolve(audio.sampleRate);
      const channels = yield* Effectable.resolve(audio.channels);
      const tracks = yield* Effectable.resolve(audio.tracks);

      return { sampleRate, channels, tracks };
    });
  };

  const renderVideo = <E, R>({
    size,
    tracks,
  }: ResolvedVideoOptions<readonly VideoTrack.VideoTrack<E, R>[], E, R>): Stream.Stream<
    Bitmap,
    E | Compositor.CompositorError,
    R | Compositor.Service
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
      Stream.mapEffect((frames) => Compositor.Service.use(({ compositeVideo }) => compositeVideo(frames, { size }))),
    );
  };

  const renderAudio = <E, R>({
    sampleRate,
    channels,
    tracks,
  }: ResolvedAudioOptions<readonly AudioTrack.AudioTrack<E, R>[], E, R>): Stream.Stream<
    AudioChunk,
    E | Compositor.CompositorError,
    R | Compositor.Service
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
      Stream.mapEffect((buffers) =>
        Compositor.Service.use(({ mixAudio }) =>
          mixAudio(
            Array.map(buffers, (buffer) => materializeAudioChunk(buffer, { sampleRate, channels })),
            { sampleRate, channels },
          ),
        ),
      ),
    );
  };

  const materializeAudioChunk = (chunk: AudioChunk, options: Compositor.AudioMixOptions): AudioBuffer => {
    if (isSilentAudioChunk(chunk))
      return {
        sampleRate: options.sampleRate,
        channels: globalThis.Array.from({ length: options.channels }, () => new Float32Array(chunk.samples)),
      };

    return chunk;
  };

  const isSilentAudioChunk = (chunk: AudioChunk): chunk is Extract<AudioChunk, { readonly _tag: "SilentAudioChunk" }> =>
    "_tag" in chunk && chunk._tag === "SilentAudioChunk";
}
