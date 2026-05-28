import { Context, Data } from "effect";
import type { Stream } from "effect";

import type { Size, VideoClip, VideoColorSpace } from "@veya/core";

export class VideoDecoder extends Context.Service<VideoDecoder, VideoDecoder.VideoDecoder>()(
  "@veya/video/VideoDecoder",
) {}

export namespace VideoDecoder {
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export type Playback = "clip" | "loop" | "freeze";

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.DecodeFailed;
  }> {}
  export namespace Error {
    export class DecodeFailed extends Data.TaggedError("DecodeFailed")<{}> {}
  }

  export type Options = {
    readonly size?: Size | undefined;
    readonly offset?: number | undefined;
    readonly duration?: number | undefined;
    readonly playback?: Playback | undefined;
    readonly speed?: number | undefined;
    readonly colorSpace?: VideoColorSpace.VideoColorSpace | undefined;
  };

  export interface VideoDecoder {
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: Options,
    ) => Stream.Stream<VideoClip.Bitmap, SourceE | Error, SourceR>;
  }
}
