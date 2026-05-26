import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { AudioClip } from "./AudioClip";

export class AudioMixer extends Context.Service<AudioMixer, AudioMixer.AudioCompositor>()("@veya/core/AudioMixer") {}

export namespace AudioMixer {
  export class AudioCompositorError extends Data.TaggedError("AudioCompositorError")<{}> {}

  export interface AudioMixOptions {
    readonly samplerate: number;
    readonly channels: number;
  }

  export interface AudioCompositor {
    readonly mix: (
      buffers: readonly AudioClip.Buffer[],
      options: AudioMixOptions,
    ) => Effect.Effect<AudioClip.Buffer, AudioCompositorError>;
  }
}
