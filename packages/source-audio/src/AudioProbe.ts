import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";
import type * as Duration from "effect/Duration";
import type { ChannelCount, SampleCount, Samplerate } from "@veya/core";

export class AudioProbe extends Context.Service<
  AudioProbe,
  {
    readonly probe: <SourceE = never, SourceR = never>(
      source: AudioProbe.MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<AudioProbe.Metadata, SourceE | AudioProbe.AudioProbeError, SourceR>;
  }
>()("@veya/source-audio/AudioProbe") {}

export namespace AudioProbe {
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class AudioProbeError extends Data.TaggedError("AudioProbeError")<{
    readonly reason?: unknown;
  }> {}

  export interface Metadata {
    readonly samplerate?: Samplerate;
    readonly channels?: ChannelCount;
    readonly samples?: SampleCount;
    readonly duration?: Duration.Duration;
  }
}
