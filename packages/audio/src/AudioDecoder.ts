import { Context, Data } from "effect";
import type { Stream } from "effect";

import type { AudioClip } from "@veya/core";

export class AudioDecoder extends Context.Service<AudioDecoder, AudioDecoder.AudioDecoder>()(
  "@veya/audio/AudioDecoder",
) {}

export namespace AudioDecoder {
  export type MediaSource<E = never, R = never> = Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.DecodeFailed;
  }> {}
  export namespace Error {
    export class DecodeFailed extends Data.TaggedError("DecodeFailed")<{}> {}
  }

  export type Options = {
    readonly offset?: number | undefined;
    readonly duration?: number | undefined;
    readonly speed?: number | undefined;
  };

  export type DecodeOptions = Options;

  export interface AudioDecoder {
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: Options,
    ) => AudioClip.AudioClip<SourceE | Error, SourceR>;
  }
}
