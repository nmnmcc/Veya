import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { AudioClip } from "@veya/core";

export class AudioResampler extends Context.Service<AudioResampler, AudioResampler.AudioResampler>()(
  "@veya/audio/AudioResampler",
) {}

export namespace AudioResampler {
  export interface AudioResampler {
    readonly resample: (channels: AudioClip.Channel[], options: Options) => Effect.Effect<AudioClip.Channel[], Error>;
  }

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.ResampleFailed;
  }> {}
  export namespace Error {
    export class ResampleFailed extends Data.TaggedError("ResampleFailed")<{}> {}
  }

  export interface Options {
    /** Source sample rate in hertz. */
    readonly source: number;
    /** Target sample rate in hertz. */
    readonly target: number;
  }
}
