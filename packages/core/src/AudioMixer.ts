import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { AudioClip } from "./AudioClip";

export class AudioMixer extends Context.Service<AudioMixer, AudioMixer.AudioCompositor>()("@veya/core/AudioMixer") {}

export namespace AudioMixer {
  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.MixFailed;
  }> {}
  export namespace Error {
    export class MixFailed extends Data.TaggedError("MixFailed")<{}> {}
  }

  export interface AudioMixOptions {
    /** Output sample rate in hertz. */
    readonly samplerate: number;
    /** Number of output channels. */
    readonly channels: number;
  }

  export interface AudioCompositor {
    readonly mix: (
      channels: readonly AudioClip.Channel[][],
      options: AudioMixOptions,
    ) => Effect.Effect<AudioClip.Channel[], Error>;
  }
}
