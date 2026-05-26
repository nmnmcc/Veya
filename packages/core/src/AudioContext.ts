import { Context } from "effect";

export class AudioContext extends Context.Service<AudioContext, AudioContext.AudioContext>()(
  "@veya/core/AudioContext",
) {}

export namespace AudioContext {
  export interface AudioContext {
    readonly samplerate: number;
    readonly channels: number;
  }
}
