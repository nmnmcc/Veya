import type { Stream } from "effect";

import { Encodable } from "./Encodable";
import type { VideoClip } from "./VideoClip";
import type { VideoContext } from "./VideoContext";

export type VideoEncodable<E = never, R = never> = Encodable<VideoContext.VideoContext, VideoClip.Bitmap, E, R>;

export namespace VideoEncodable {
  export const make = <E = never, R = never>(
    stream: Stream.Stream<VideoClip.Bitmap, E, R>,
    context: VideoContext.VideoContext,
  ): VideoEncodable<E, R> => Encodable.make(stream, context);
}
