import { Stream } from "effect";

export namespace VideoClip {
  export type RGBA = readonly [red: number, green: number, blue: number, alpha: number];

  export type Bitmap = readonly (readonly RGBA[])[];

  export interface VideoClip<E = never, R = never> extends Stream.Stream<Bitmap, E, R> {}

  export type Any = VideoClip<any, any>;
}
