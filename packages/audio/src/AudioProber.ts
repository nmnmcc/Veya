import { Context, Data, Duration } from "effect";
import type { Effect, Stream } from "effect";

export class AudioProber extends Context.Service<AudioProber, AudioProber.AudioProber>()("@veya/audio/AudioProber") {}

export namespace AudioProber {
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class AudioProberError extends Data.TaggedError("AudioProberError")<{
    readonly reason?: unknown;
  }> {}

  export interface Metadata {
    readonly samplerate?: number;
    readonly channels?: number;
    readonly samples?: number;
    readonly duration?: Duration.Duration;
  }

  export interface AudioProber {
    readonly probe: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<Metadata, SourceE | AudioProberError, SourceR>;
  }
}
