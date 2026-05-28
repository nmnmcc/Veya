import { Schema, Stream } from "effect";

import type { Size } from "./Size";
import type { VideoColorSpace } from "./VideoColorSpace";

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
  export namespace Bitmap {
    export const fromImageData = ({ data, width, height }: ImageData): Bitmap => {
      let offset = 0;

      return globalThis.Array.from({ length: height }, () =>
        globalThis.Array.from({ length: width }, () => {
          const pixel = Schema.decodeUnknownSync(RGBA)([
            data[offset + 0],
            data[offset + 1],
            data[offset + 2],
            data[offset + 3],
          ]);
          offset += 4;

          return pixel;
        }),
      );
    };

    export const toImageData = (
      bitmap: Bitmap,
      [width, height]: Size = [bitmap[0]?.length!, bitmap.length],
      colorSpace: VideoColorSpace.VideoColorSpace = "srgb",
    ): ImageData => {
      const data = new Uint8ClampedArray(width * height * 4);
      let offset = 0;

      for (let y = 0; y < height; y += 1) {
        const row = bitmap[y];

        for (let x = 0; x < width; x += 1) {
          const pixel = Schema.decodeUnknownSync(RGBA)(row?.[x]);

          data[offset + 0] = pixel[0];
          data[offset + 1] = pixel[1];
          data[offset + 2] = pixel[2];
          data[offset + 3] = pixel[3];
          offset += 4;
        }
      }

      return new ImageData(data, width, height, { colorSpace });
    };
  }

  export interface VideoClip<E = never, R = never> extends Stream.Stream<Bitmap, E, R> {}
}
