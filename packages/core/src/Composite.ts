import { Array, Stream, pipe } from "effect";
import type { AudioBuffer, AudioChunk, ChannelCount, SampleRate, Size } from "./media";
import type { AudioClip } from "./AudioClip";
import type { AudioTrack } from "./AudioTrack";
import { Compositor } from "./Compositor";
import type { VideoClip } from "./VideoClip";
import type { VideoTrack } from "./VideoTrack";

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
              mixAudio(
                Array.map(buffers, (buffer) =>
                  materializeAudioChunk(buffer, { sampleRate: audio.sampleRate, channels: audio.channels }),
                ),
                { sampleRate: audio.sampleRate, channels: audio.channels },
              ),
            ),
          ),
        ),
      },
    };
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
