import { Effect, Schedule, Stream } from "effect";
import { Effectable } from "./Effectable";
import type { FrameCount } from "./media";
import { VideoClip } from "./VideoClip";

export namespace Gap {
  export interface Gap<E = never, R = never> extends VideoClip.VideoClip<E, R> {}

  export const make = <E = never, R = never>(duration: Effectable<FrameCount, E, R>): Gap<E, R> => {
    return {
      render: Stream.unwrap(
        Effect.map(Effectable.resolve(duration), (duration) =>
          Stream.repeat(Stream.make([]), Schedule.recurs(duration)),
        ),
      ),
    };
  };
}
