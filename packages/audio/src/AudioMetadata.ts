import { Context } from "effect";

export class AudioMetadata extends Context.Service<AudioMetadata, AudioMetadata.AudioMetadata>()(
  "@veya/audio/AudioMetadata",
) {}

export namespace AudioMetadata {
  export interface AudioMetadata {
    /** Source sample rate in hertz. */
    readonly samplerate?: number;
    /** Number of source channels. */
    readonly channels?: number;
    /** Number of samples in the source. */
    readonly samples?: number;
  }
}
