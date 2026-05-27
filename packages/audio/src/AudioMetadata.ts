import { Context } from "effect";

export class AudioMetadata extends Context.Service<AudioMetadata, AudioMetadata.AudioMetadata>()(
  "@veya/audio/AudioMetadata",
) {}

export namespace AudioMetadata {
  export interface AudioMetadata {
    readonly samplerate?: number;
    readonly channels?: number;
    readonly samples?: number;
    readonly duration?: number;
  }
}
