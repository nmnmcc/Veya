import { Context, Data } from "effect";
import type { Stream } from "effect";
import type { Bitmap, Size } from "@veya/core";

export class VideoSource extends Context.Service<VideoSource, VideoSource.Service>()("@veya/video/VideoSource") {}

export namespace VideoSource {
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export type Playback = "clip" | "loop" | "freeze";

  export class VideoSourceError extends Data.TaggedError("VideoSourceError")<{
    readonly reason?: unknown;
  }> {}

  export type Options = {
    readonly size?: Size;
    readonly framerate?: number;
    readonly offset?: number;
    readonly frames?: number;
    readonly playback?: Playback;
    readonly speed?: number;
  };

  export interface Service {
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: Options,
    ) => Stream.Stream<Bitmap, SourceE | VideoSourceError, SourceR>;
  }
}
