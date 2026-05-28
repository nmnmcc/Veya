import { Context } from "effect";

/** Effect service that exposes metadata for the current audio source. */
export class AudioMetadata extends Context.Service<AudioMetadata, AudioMetadata.AudioMetadata>()(
  "@veya/audio/AudioMetadata",
) {}

export namespace AudioMetadata {
  /** Metadata discovered by an `AudioProber`. */
  export interface AudioMetadata {
    /** Source sample rate in hertz. */
    readonly samplerate?: number;
    /** Number of source channels. */
    readonly channels?: number;
    /** Number of samples in the source. */
    readonly samples?: number;
    /** Source duration in seconds. */
    readonly duration?: number;
  }
}
