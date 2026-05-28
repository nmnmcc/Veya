import { Data } from "effect";

export namespace MediabunnyEncoding {
  /** Encoded media bytes and their MIME type. */
  export interface Result {
    /** Encoded media payload. */
    readonly buffer: Uint8Array;
    /** MIME type reported by the selected output format. */
    readonly mimeType: string;
  }

  /** Error raised while encoding or multiplexing media with Mediabunny. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the encoding failure. */
    readonly reason: Error.EncodeFailed | Error.InvalidAudioClip | Error.InvalidOutputBuffer | Error.InvalidVideoFrame;
  }> {}
  export namespace Error {
    /** Indicates that Mediabunny failed while starting, writing, or finalizing output. */
    export class EncodeFailed extends Data.TaggedError("EncodeFailed")<{}> {}
    /** Indicates that an audio clip could not be represented as encoder samples. */
    export class InvalidAudioClip extends Data.TaggedError("InvalidAudioClip")<{
      /** Human-readable validation message. */
      readonly message: string;
    }> {}
    /** Indicates that Mediabunny did not produce an output buffer. */
    export class InvalidOutputBuffer extends Data.TaggedError("InvalidOutputBuffer")<{}> {}
    /** Indicates that a video frame could not be represented as an encoder sample. */
    export class InvalidVideoFrame extends Data.TaggedError("InvalidVideoFrame")<{
      /** Human-readable validation message. */
      readonly message: string;
    }> {}
  }

  /** Converts any thrown value into a `MediabunnyEncoding.Error`. */
  export const toEncodeFailed = (cause: unknown): Error =>
    cause instanceof Error
      ? cause
      : new Error({
          cause,
          reason: new Error.EncodeFailed(),
        });
}
