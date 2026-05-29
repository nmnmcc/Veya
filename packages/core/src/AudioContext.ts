import { Context } from "effect";

export class AudioContext extends Context.Service<AudioContext, AudioContext.AudioContext>()(
  "@veya/core/AudioContext",
) {}

export namespace AudioContext {
  export interface AudioContext {
    /** Output sample rate in hertz. */
    readonly samplerate: number;
    /** Number of output channels. */
    readonly channels: number;
  }
}
