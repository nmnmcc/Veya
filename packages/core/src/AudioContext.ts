import { Context } from "effect";

export class AudioContext extends Context.Service<AudioContext, AudioContext.CompositeAudioContext>()(
  "@veya/core/CompositeAudioContext",
) {}

export namespace AudioContext {
  export interface CompositeAudioContext {
    readonly samplerate: number;
    readonly channels: number;
  }
}
