import { Context, Data } from "effect";
import type { Stream } from "effect";

import type { Size, VideoClip } from "@veya/core";

export class VideoDecoder extends Context.Service<VideoDecoder, VideoDecoder.VideoDecoder>()(
  "@veya/video/VideoDecoder",
) {}

export namespace VideoDecoder {
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export type Playback = "clip" | "loop" | "freeze";

  export class VideoDecoderError extends Data.TaggedError("VideoDecoderError")<{
    readonly reason?: unknown;
  }> {}

  export type Options = {
    readonly size?: Size;
    readonly framerate?: number;
    readonly offset?: number;
    readonly duration?: number;
    readonly playback?: Playback;
    readonly speed?: number;
  };

  export interface VideoDecoder {
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: Options,
    ) => Stream.Stream<VideoClip.Bitmap, SourceE | VideoDecoderError, SourceR>;
  }
}
