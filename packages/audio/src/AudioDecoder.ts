import { Context, Data } from "effect";
import type { Stream } from "effect";

import type { AudioClip, AudioTick } from "@veya/core";

/** Effect service for turning audio bytes into audio sample streams. */
export class AudioDecoder extends Context.Service<AudioDecoder, AudioDecoder.AudioDecoder>()(
  "@veya/audio/AudioDecoder",
) {}

export namespace AudioDecoder {
  /** Audio input as a byte array or a stream of byte chunks. */
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  /** Error raised when an audio decoder implementation cannot decode a source. */
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

  /** Resolved options passed to an audio decoder implementation. */
  export type Options = {
    /** Start time offset, in seconds. */
    readonly offset?: number | undefined;
    /** Clip duration, in seconds. */
    readonly duration?: number | undefined;
    /** Playback speed multiplier. */
    readonly speed?: number | undefined;
  };

  /** Alias for decoder options. */
  export type DecodeOptions = Options;

  /** Service contract for custom audio decoder implementations. */
  export interface AudioDecoder {
    /** Decodes a media source into an audio clip. */
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: Options,
    ) => AudioClip.AudioClip<AudioTick, never, never, SourceE | Error, SourceR>;
  }
}
