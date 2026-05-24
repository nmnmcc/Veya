import { Context, Data } from "effect";
import type { Stream } from "effect";
import type { AudioChunk, ChannelCount, SampleCount, Samplerate } from "@veya/core";
import { AudioProbe } from "./AudioProbe";

export class AudioSource extends Context.Service<AudioSource, AudioSource.Service>()(
  "@veya/source-audio/AudioSource",
) {}

export namespace AudioSource {
  export type MediaSource<E = never, R = never> = AudioProbe.MediaSource<E, R>;

  export class AudioSourceError extends Data.TaggedError("AudioSourceError")<{
    readonly reason?: unknown;
  }> {}

  export interface DecodeOptions {
    readonly samplerate?: Samplerate;
    readonly channels?: ChannelCount;
    readonly offset?: SampleCount;
    readonly samples?: SampleCount;
    readonly speed?: number;
  }

  export interface Service {
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: DecodeOptions,
    ) => Stream.Stream<AudioChunk, SourceE | AudioSourceError, SourceR>;
  }
}
