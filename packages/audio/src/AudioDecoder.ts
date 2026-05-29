import { Context, Data } from "effect";
import type { Stream } from "effect";

import type { AudioClip, AudioTick } from "@veya/core";

export class AudioDecoder extends Context.Service<AudioDecoder, AudioDecoder.AudioDecoder>()(
  "@veya/audio/AudioDecoder",
) {}

export namespace AudioDecoder {
  export interface AudioDecoder {
    readonly decode: <E = never, R = never>(
      source: MediaSource<E, R>,
      options: Options,
    ) => AudioClip.AudioClip<AudioTick, never, never, E | Error, R>;
  }

  /** Audio input as a byte array or a stream of byte chunks. */
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.DecodeFailed;
  }> {}
  export namespace Error {
    export class DecodeFailed extends Data.TaggedError("DecodeFailed")<{}> {}
  }

  export type Options = {
    /** Start offset in source samples. */
    readonly offset?: number | undefined;
    /** Clip duration in source samples. */
    readonly duration?: number | undefined;
    /** Playback speed multiplier. */
    readonly speed?: number | undefined;
  };
}
