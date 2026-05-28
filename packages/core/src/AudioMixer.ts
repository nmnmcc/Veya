import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { AudioClip } from "./AudioClip";

/** Effect service used by `AudioMix` to combine audio tracks. */
export class AudioMixer extends Context.Service<AudioMixer, AudioMixer.AudioCompositor>()("@veya/core/AudioMixer") {}

export namespace AudioMixer {
  /** Error raised when an audio mixer implementation cannot mix channels. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the mixer failure. */
    readonly reason: Error.MixFailed;
  }> {}
  export namespace Error {
    /** Indicates that an audio mix operation failed. */
    export class MixFailed extends Data.TaggedError("MixFailed")<{}> {}
  }

  /** Output settings passed to an audio mixer implementation. */
  export interface AudioMixOptions {
    /** Output sample rate in hertz. */
    readonly samplerate: number;
    /** Number of output channels. */
    readonly channels: number;
  }

  /** Service contract for custom audio mixer implementations. */
  export interface AudioCompositor {
    /** Combines channel groups from multiple tracks into one channel group. */
    readonly mix: (
      channels: readonly AudioClip.Channel[][],
      options: AudioMixOptions,
    ) => Effect.Effect<AudioClip.Channel[], Error>;
  }
}
