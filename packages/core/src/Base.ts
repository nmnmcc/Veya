import type { Stream } from "effect";

import type { Encodable } from "./Encodable";

/** Pixel dimensions expressed as `[width, height]`. */
export type Size = readonly [width: number, height: number];

export type Clip<C, I, O, IE = never, IR = never, OE = never, OR = never> = (
  stream: Stream.Stream<I, IE, IR>,
) => Encodable<C, O, OE, OR>;
