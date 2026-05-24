import { Context, Data } from "effect";
import type { Effect } from "effect";
import type { AudioBuffer, Bitmap, ChannelCount, Samplerate, Size } from "./media";

export class Compositor extends Context.Service<Compositor, Compositor.Compositor>()("@veya/core/Compositor") {}

export namespace Compositor {
  export class CompositorError extends Data.TaggedError("CompositorError")<{}> {}

  export interface VideoCompositeOptions {
    readonly size: Size;
  }

  export interface AudioMixOptions {
    readonly samplerate: Samplerate;
    readonly channels: ChannelCount;
  }

  export interface Compositor {
    readonly compositeVideo: (
      frames: readonly Bitmap[],
      options: VideoCompositeOptions,
    ) => Effect.Effect<Bitmap, CompositorError>;
    readonly mixAudio: (
      buffers: readonly AudioBuffer[],
      options: AudioMixOptions,
    ) => Effect.Effect<AudioBuffer, CompositorError>;
  }
}
