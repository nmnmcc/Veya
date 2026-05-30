import { Stream } from "effect";

export namespace VideoTick {
  export const frames = () => Stream.iterate(0, (n) => n + 1);
  export type Frames = Stream.Stream<number>;
}
