import { Context, Data } from "effect";
import type { Stream } from "effect";

import type { Size, VideoClip, VideoColor } from "@veya/core";

export class VideoDecoder extends Context.Service<VideoDecoder, VideoDecoder.VideoDecoder>()(
  "@veya/video/VideoDecoder",
) {}

export namespace VideoDecoder {
  export interface VideoDecoder {
    readonly decode: <E = never, R = never>(
      source: MediaSource<E, R>,
      options: Options,
    ) => Stream.Stream<VideoClip.Bitmap, E | Error, R>;
  }

  /** Video input as a byte array or a stream of byte chunks. */
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  /** Playback behavior used when a clip needs frames beyond the decoded source. */
  export type Playback = "clip" | "loop" | "freeze";

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.DecodeFailed;
  }> {}
  export namespace Error {
    export class DecodeFailed extends Data.TaggedError("DecodeFailed")<{}> {}
  }

  export type Options = {
    /** Output frame size in pixels. */
    readonly size?: Size | undefined;
    /** Start offset in source frames. */
    readonly offset?: number | undefined;
    /** Clip duration in source frames. */
    readonly duration?: number | undefined;
    /** Behavior when playback reaches the end of the source. */
    readonly playback?: Playback | undefined;
    /** Playback speed multiplier. */
    readonly speed?: number | undefined;
    /** Source color space. */
    readonly colorSpace?: VideoColor.ColorSpace | undefined;
  };
}
