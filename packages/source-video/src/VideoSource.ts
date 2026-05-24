import { Context, Data } from "effect";
import type { Stream } from "effect";
import type { Bitmap, FrameCount, Size } from "@veya/core";
import { VideoFrame } from "./VideoFrame";
import { VideoProbe } from "./VideoProbe";

export class VideoSource extends Context.Service<VideoSource, VideoSource.Service>()(
  "@veya/source-video/VideoSource",
) {}

export namespace VideoSource {
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

  export interface Service {
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: DecodeOptions,
    ) => Stream.Stream<Bitmap, SourceE | VideoSourceError, SourceR>;
  }
}
