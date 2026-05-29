import { Data } from "effect";

export namespace MediabunnyEncoding {
  export interface Result {
    readonly buffer: Uint8Array;
    /** MIME type reported by the selected output format. */
    readonly mimeType: string;
  }

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.EncodeFailed | Error.InvalidAudioClip | Error.InvalidOutputBuffer | Error.InvalidVideoFrame;
  }> {}
  export namespace Error {
    export class EncodeFailed extends Data.TaggedError("EncodeFailed")<{}> {}
    /** Indicates that an audio clip could not be represented as encoder samples. */
    export class InvalidAudioClip extends Data.TaggedError("InvalidAudioClip")<{
      readonly message: string;
    }> {}
    export class InvalidOutputBuffer extends Data.TaggedError("InvalidOutputBuffer")<{}> {}
    /** Indicates that a video frame could not be represented as an encoder sample. */
    export class InvalidVideoFrame extends Data.TaggedError("InvalidVideoFrame")<{
      readonly message: string;
    }> {}
  }

  export const toEncodeFailed = (cause: unknown): Error =>
    cause instanceof Error
      ? cause
      : new Error({
          cause,
          reason: new Error.EncodeFailed(),
        });
}
