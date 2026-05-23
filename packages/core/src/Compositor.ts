import { Context, Data } from "effect";
import type { Effect } from "effect";
import type { AudioBuffer, Bitmap, ChannelCount, SampleRate, Size } from "./media";

export namespace Compositor {
  export class CompositorError extends Data.TaggedError("CompositorError")<{}> {}

  export interface VideoCompositeOptions {
    readonly size: Size;
  }

  export interface AudioMixOptions {
    readonly sampleRate: SampleRate;
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

  export class Service extends Context.Service<Service, Compositor>()("@veya/core/index/Compositor/Service") {}
}
