import { Schedule, Stream } from "effect";
import type { FrameCount } from "./media";
import { VideoClip } from "./VideoClip";

export namespace Gap {
  export interface Gap extends VideoClip.VideoClip<never, never> {}

  export const make = (duration: FrameCount): Gap => {
    return {
      render: Stream.repeat(Stream.make([]), Schedule.recurs(duration)),
    };
  };
}
