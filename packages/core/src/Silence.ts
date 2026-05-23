import { Stream } from "effect";
import type { SampleCount } from "./media";
import { AudioClip } from "./AudioClip";

export namespace Silence {
  export interface Silence extends AudioClip.AudioClip<never, never> {}

  export const make = (samples: SampleCount): Silence => {
    return {
      render: Stream.make({
        _tag: "SilentAudioChunk",
        samples,
      }),
    };
  };
}
