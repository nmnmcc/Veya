import type { Stream } from "effect";

/** Pixel dimensions expressed as `[width, height]`. */
export type Size = readonly [width: number, height: number];

export type Clip<I, O, IE = never, IR = never, OE = never, OR = never> = (
  stream: Stream.Stream<I, IE, IR>,
) => Stream.Stream<O, OE, OR>;
