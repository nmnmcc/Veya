import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { AudioDecoder } from "./AudioDecoder";
import type { AudioMetadata } from "./AudioMetadata";

export class AudioProber extends Context.Service<AudioProber, AudioProber.AudioProber>()("@veya/audio/AudioProber") {}

export namespace AudioProber {
  export interface AudioProber {
    readonly probe: <E = never, R = never>(
      source: MediaSource<E, R>,
    ) => Effect.Effect<AudioMetadata.AudioMetadata, E | Error, R>;
  }

  export type MediaSource<E = never, R = never> = AudioDecoder.MediaSource<E, R>;

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.ProbeFailed;
  }> {}
  export namespace Error {
    export class ProbeFailed extends Data.TaggedError("ProbeFailed")<{}> {}
  }
}
