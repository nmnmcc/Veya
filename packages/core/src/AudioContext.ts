import { Context } from "effect";

/** Effect service that provides the audio settings for rendering. */
export class AudioContext extends Context.Service<AudioContext, AudioContext.AudioContext>()(
  "@veya/core/AudioContext",
) {}

export namespace AudioContext {
  /** Audio render settings shared by audio clips and mixers. */
  export interface AudioContext {
    /** Output sample rate in hertz. */
    readonly samplerate: number;
    /** Number of output channels. */
    readonly channels: number;
  }
}
