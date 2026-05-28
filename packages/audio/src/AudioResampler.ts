import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { AudioClip } from "@veya/core";

/** Effect service for adapting audio channels from one sample rate to another. */
export class AudioResampler extends Context.Service<AudioResampler, AudioResampler.AudioResampler>()(
  "@veya/audio/AudioResampler",
) {}

export namespace AudioResampler {
  /** Error raised when audio sample-rate conversion fails. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the resampling failure. */
    readonly reason: Error.ResampleFailed;
  }> {}
  export namespace Error {
    /** Indicates that sample-rate conversion failed. */
    export class ResampleFailed extends Data.TaggedError("ResampleFailed")<{}> {}
  }

  /** Source and target sample rates for a resampling operation. */
  export interface Options {
    /** Source sample rate in hertz. */
    readonly source: number;
    /** Target sample rate in hertz. */
    readonly target: number;
  }

  /** Service contract for custom audio resampler implementations. */
  export interface AudioResampler {
    /** Resamples audio channels to the requested target sample rate. */
    readonly resample: (channels: AudioClip.Channel[], options: Options) => Effect.Effect<AudioClip.Channel[], Error>;
  }
}
