import { Context, Data } from "effect";
import type { Stream } from "effect";

import type { Size, VideoClip, VideoColorSpace } from "@veya/core";

/** Effect service for turning video bytes into bitmap frames. */
export class VideoDecoder extends Context.Service<VideoDecoder, VideoDecoder.VideoDecoder>()(
  "@veya/video/VideoDecoder",
) {}

export namespace VideoDecoder {
  /** Video input as a byte array or a stream of byte chunks. */
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  /** Playback behavior used when a clip needs frames beyond the decoded source. */
  export type Playback = "clip" | "loop" | "freeze";

  /** Error raised when a video decoder implementation cannot decode a source. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the decode failure. */
    readonly reason: Error.DecodeFailed;
  }> {}
  export namespace Error {
    /** Indicates that decoding failed. */
    export class DecodeFailed extends Data.TaggedError("DecodeFailed")<{}> {}
  }

  /** Resolved options passed to a video decoder implementation. */
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
    readonly colorSpace?: VideoColorSpace.VideoColorSpace | undefined;
  };

  /** Service contract for custom video decoder implementations. */
  export interface VideoDecoder {
    /** Decodes a media source into a stream of bitmap frames. */
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: Options,
    ) => Stream.Stream<VideoClip.Bitmap, SourceE | Error, SourceR>;
  }
}
