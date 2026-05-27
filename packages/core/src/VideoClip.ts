import { Schema, Stream } from "effect";

export namespace VideoClip {
  const RorGorB = Schema.Number.check(
    Schema.isBetween({
      minimum: 0,
      maximum: 255,
    }),
  );
  const A = Schema.Number.check(
    Schema.isBetween({
      minimum: 0,
      maximum: 1,
    }),
  );
  export const RGB = Schema.Tuple([RorGorB, RorGorB, RorGorB]);
  export type RGB = typeof RGB.Type;

  export const RGBA = Schema.Tuple([...RGB.elements, A]);
  export type RGBA = typeof RGBA.Type;

  export type Bitmap = readonly (readonly RGBA[])[];

  export interface VideoClip<E = never, R = never> extends Stream.Stream<Bitmap, E, R> {}
}
