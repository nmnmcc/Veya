import { Context, Data } from "effect";
import type { Stream } from "effect";

import type { AudioClip } from "@veya/core";

export class AudioDecoder extends Context.Service<AudioDecoder, AudioDecoder.AudioDecoder>()(
  "@veya/audio/AudioDecoder",
) {}

export namespace AudioDecoder {
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class AudioDecoderError extends Data.TaggedError("AudioDecoderError")<{
    readonly reason?: unknown;
  }> {}

  export type Options = {
    readonly samplerate?: number;
    readonly channels?: number;
    readonly offset?: number;
    readonly duration?: number;
    readonly speed?: number;
  };

  export type DecodeOptions = Options;

  export interface AudioDecoder {
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: Options,
    ) => Stream.Stream<AudioClip.Buffer, SourceE | AudioDecoderError, SourceR>;
  }
}
