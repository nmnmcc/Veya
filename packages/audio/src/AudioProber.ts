import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { AudioDecoder } from "./AudioDecoder";
import type { AudioMetadata } from "./AudioMetadata";

/** Effect service for reading audio metadata without decoding every sample. */
export class AudioProber extends Context.Service<AudioProber, AudioProber.AudioProber>()("@veya/audio/AudioProber") {}

export namespace AudioProber {
  /** Audio input accepted by audio probers. */
  export type MediaSource<E = never, R = never> = AudioDecoder.MediaSource<E, R>;
  /** Metadata returned by audio probers. */
  export type Metadata = AudioMetadata.AudioMetadata;

  /** Error raised when an audio prober implementation cannot inspect a source. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the probe failure. */
    readonly reason: Error.ProbeFailed;
  }> {}
  export namespace Error {
    /** Indicates that metadata probing failed. */
    export class ProbeFailed extends Data.TaggedError("ProbeFailed")<{}> {}
  }

  /** Service contract for custom audio metadata probers. */
  export interface AudioProber {
    /** Reads metadata from an audio media source. */
    readonly probe: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<Metadata, SourceE | Error, SourceR>;
  }
}
