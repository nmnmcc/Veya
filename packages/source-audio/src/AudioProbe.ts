import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";
import type * as Duration from "effect/Duration";
import type { ChannelCount, SampleCount, SampleRate } from "@veya/core";

export namespace AudioProbe {
  export type MediaSource<E = never, R = never> = string | URL | Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class AudioProbeError extends Data.TaggedError("AudioProbeError")<{
    readonly reason?: unknown;
  }> {}

  export interface Metadata {
    readonly sampleRate?: SampleRate;
    readonly channels?: ChannelCount;
    readonly samples?: SampleCount;
    readonly duration?: Duration.Duration;
  }

  export interface AudioProbe {
    readonly probe: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<Metadata, SourceE | AudioProbeError, SourceR>;
  }

  export class Service extends Context.Service<Service, AudioProbe>()("@veya/source-audio/AudioProbe/Service") {}
}
