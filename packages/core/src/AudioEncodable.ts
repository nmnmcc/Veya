import type { Stream } from "effect";

import type { AudioClip } from "./AudioClip";
import type { AudioContext } from "./AudioContext";
import { Encodable } from "./Encodable";

export type AudioEncodable<E = never, R = never> = Encodable<AudioContext.AudioContext, AudioClip.Channel[], E, R>;

export namespace AudioEncodable {
  export const make = <E = never, R = never>(
    stream: Stream.Stream<AudioClip.Channel[], E, R>,
    context: AudioContext.AudioContext,
  ): AudioEncodable<E, R> => Encodable.make(stream, context);
}
