import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { AudioDecoder } from "./AudioDecoder";
import type { AudioMetadata } from "./AudioMetadata";

export class AudioProber extends Context.Service<AudioProber, AudioProber.AudioProber>()("@veya/audio/AudioProber") {}

export namespace AudioProber {
  export type MediaSource<E = never, R = never> = AudioDecoder.MediaSource<E, R>;
  export type Metadata = AudioMetadata.AudioMetadata;

  export class AudioProberError extends Data.TaggedError("AudioProberError")<{
    readonly reason?: unknown;
  }> {}

  export interface AudioProber {
    readonly probe: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<Metadata, SourceE | AudioProberError, SourceR>;
  }
}
