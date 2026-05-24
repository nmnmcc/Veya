import { Context } from "effect";
import type { ChannelCount, Samplerate } from "./media";

export class CompositeAudioContext extends Context.Service<
  CompositeAudioContext,
  CompositeAudioContext.CompositeAudioContext
>()("@veya/core/CompositeAudioContext") {}

export namespace CompositeAudioContext {
  export interface CompositeAudioContext {
    readonly samplerate: Samplerate;
    readonly channels: ChannelCount;
  }
}
