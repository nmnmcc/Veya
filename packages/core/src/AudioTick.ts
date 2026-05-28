import { Stream } from "effect";

export type AudioTick = number;

export namespace AudioTick {
  export const samples = () => Stream.iterate(0, (n) => n + 1);
}
