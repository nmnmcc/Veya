import { Effect, Function, Schema, Stream } from "effect";

import type { Clip, Size } from "./Base";
import { Encodable } from "./Encodable";
import type { VideoColorSpace } from "./VideoColorSpace";
import { VideoContext } from "./VideoContext";

export namespace VideoClip {
  export type VideoClip<I, IE = never, IR = never, OE = never, OR = never> = Clip<
    VideoContext.VideoContext,
    I,
    Bitmap,
    IE,
    IR,
    OE,
    OR
  >;

  /** Creates a video clip from a stream transformer. */
  export const make = <I, IE = never, IR = never, OE = never, OR = never>(
    clip: (stream: Stream.Stream<I, IE, IR>) => Stream.Stream<Bitmap, OE, OR>,
  ): Effect.Effect<VideoClip<I, IE, IR, OE, Exclude<OR, VideoContext>>, never, VideoContext> =>
    Effect.gen(function* () {
      const context = yield* VideoContext;

      return (stream: Stream.Stream<I, IE, IR>) =>
        Encodable.make(clip(stream).pipe(Stream.provideService(VideoContext, context)), context);
    });

  const R_G_B = Schema.Number.check(Schema.isBetween({ minimum: 0, maximum: 255 }));
  const A = Schema.Number.check(Schema.isBetween({ minimum: 0, maximum: 1 }));

  /** Runtime schema for an RGB color tuple. */
  export const RGB = Schema.Tuple([R_G_B, R_G_B, R_G_B]);
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
    export const toImageData: {
      (size?: Size, colorSpace?: VideoColorSpace.VideoColorSpace): (bitmap: Bitmap) => ImageData;
      (bitmap: Bitmap, size?: Size, colorSpace?: VideoColorSpace.VideoColorSpace): ImageData;
    } = Function.dual(
      (args) => isBitmap(args[0]),
      (
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
      },
    );
  }

  const isBitmap = (value: unknown): value is Bitmap => {
    if (!globalThis.Array.isArray(value)) {
      return false;
    }

    const [row] = value;

    if (row === undefined) {
      return true;
    }

    if (!globalThis.Array.isArray(row)) {
      return false;
    }

    const [pixel] = row;

    return pixel === undefined || globalThis.Array.isArray(pixel);
  };
}
