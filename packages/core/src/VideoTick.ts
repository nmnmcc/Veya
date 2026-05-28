import { Stream } from "effect";

export type VideoTick = number;

export namespace VideoTick {
  export const frames = () => Stream.iterate(0, (n) => n + 1);
}
