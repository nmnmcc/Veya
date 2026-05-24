import { Context, Data } from "effect";
import type { Stream } from "effect";
import type { Composite } from "./Composite";

export class Encoder extends Context.Service<Encoder, Encoder.Encoder>()("@veya/core/Encoder") {}

export namespace Encoder {
  export class EncoderError extends Data.TaggedError("EncoderError")<{}> {}

  export interface VideoOptions {
    readonly codec?: string;
    readonly bitrate?: number;
  }

  export interface AudioOptions {
    readonly codec?: string;
    readonly bitrate?: number;
  }

  export interface Options {
    readonly container: string;
    readonly filename?: string;
    readonly video?: VideoOptions;
    readonly audio?: AudioOptions;
  }

  export interface EncodedFile<E = never, R = never> {
    readonly filename?: string;
    readonly mimeType: string;
    readonly data: Stream.Stream<Uint8Array, E, R>;
  }

  export interface Encoder {
    readonly encode: <E = never, R = never>(
      composite: Composite.Composite<E, R>,
      options: Options,
    ) => EncodedFile<E | EncoderError, R>;
  }
}
