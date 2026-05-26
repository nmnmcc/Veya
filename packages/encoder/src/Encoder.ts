import { Context, Data } from "effect";
import type { Stream } from "effect";

import type { Composite } from "@veya/core";

export class Encoder extends Context.Service<Encoder, Encoder.Encoder>()("@veya/encoder/Encoder") {}

export namespace Encoder {
  export class EncoderError extends Data.TaggedError("EncoderError")<{
    readonly reason?: unknown;
  }> {}

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
    /**
     * The encoded byte stream. Implementations may defer actual encoding until this stream is consumed.
     */
    readonly data: Stream.Stream<Uint8Array, E, R>;
  }

  export interface Encoder {
    readonly encode: <VideoE = never, VideoR = never, AudioE = VideoE, AudioR = VideoR>(
      composite: Composite.Composite<VideoE, VideoR, AudioE, AudioR>,
      options: Options,
    ) => EncodedFile<VideoE | AudioE | EncoderError, VideoR | AudioR>;
  }
}
