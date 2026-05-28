import { Schema, Stream } from "effect";

import type { Clip, Size } from "./Base";
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

  /** Runtime schema for an RGB color tuple. */
  export const RGB = Schema.Tuple([RorGorB, RorGorB, RorGorB]);
  /** RGB color tuple in red, green, and blue channel order. */
  export type RGB = typeof RGB.Type;

  /** Runtime schema for an RGBA color tuple. */
  export const RGBA = Schema.Tuple([...RGB.elements, A]);
  /** RGBA color tuple in red, green, blue, and alpha channel order. */
  export type RGBA = typeof RGBA.Type;

  /** A video frame represented as rows of RGBA pixels. */
  export type Bitmap = readonly (readonly RGBA[])[];

  /** Helpers for converting between Veya bitmaps and browser ImageData. */
  export namespace Bitmap {
    /** Converts browser `ImageData` into a Veya bitmap. */
    export const fromImageData = ({ data, width, height }: ImageData): Bitmap => {
      let offset = 0;

      return globalThis.Array.from({ length: height }, () =>
        globalThis.Array.from({ length: width }, () => {
          const pixel = Schema.decodeUnknownSync(RGBA)([
            data[offset + 0],
            data[offset + 1],
            data[offset + 2],
            (data[offset + 3] ?? 0) / 255,
          ]);
          offset += 4;

          return pixel;
        }),
      );
    };

    /** Converts a Veya bitmap into browser `ImageData`. */
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
          data[offset + 3] = pixel[3] * 255;
          offset += 4;
        }
      }

      return new ImageData(data, width, height, { colorSpace });
    };
  }

  export type VideoClip<I, IE = never, IR = never, OE = never, OR = never> = Clip<I, Bitmap, IE, IR, OE, OR>;

  export type Encodable<E = never, R = never> = Stream.Stream<Bitmap, E, R>;
}
