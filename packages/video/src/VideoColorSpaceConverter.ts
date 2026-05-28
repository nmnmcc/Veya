import { P3, sRGB, to } from "colorjs.io/fn";
import type { RGBColorSpace } from "colorjs.io/fn";
import { Context, Layer, Schema } from "effect";

import { VideoClip, VideoColorSpace } from "@veya/core";

/** Effect service for converting bitmap frames between supported color spaces. */
export class VideoColorSpaceConverter extends Context.Service<
  VideoColorSpaceConverter,
  VideoColorSpaceConverter.VideoColorGamutConverter
>()("@veya/video/VideoColorGamutConverter") {}

export namespace VideoColorSpaceConverter {
  /** Mapping from Veya color space names to Color.js color spaces. */
  export const ColorSpaceMap = {
    "display-p3": P3,
    srgb: sRGB,
  } as const satisfies Record<VideoColorSpace.VideoColorSpace, RGBColorSpace>;

  /** Color space conversion options. */
  export interface Options {
    /** Color space of the input bitmap. Defaults to `srgb`. */
    readonly source?: VideoColorSpace.VideoColorSpace | undefined;
    /** Color space of the output bitmap. Defaults to `srgb`. */
    readonly target?: VideoColorSpace.VideoColorSpace | undefined;
  }

  /** Service contract for bitmap color space conversion. */
  export interface VideoColorGamutConverter {
    /** Converts a bitmap from one supported color space to another. */
    readonly convert: (bitmap: VideoClip.Bitmap, options: Options) => VideoClip.Bitmap;
  }

  /** Creates the default Color.js-backed color space converter. */
  export const make = (): VideoColorGamutConverter => ({
    convert,
  });

  /** Layer that provides the default color space converter. */
  export const layer = Layer.succeed(VideoColorSpaceConverter, make());

  /** Converts a bitmap between supported color spaces. */
  export const convert = (bitmap: VideoClip.Bitmap, options: Options): VideoClip.Bitmap => {
    const source = options.source ?? VideoColorSpace.Default;
    const target = options.target ?? VideoColorSpace.Default;

    if (source === target) {
      return bitmap;
    }

    const mapper = ([red, green, blue, alpha]: VideoClip.RGBA) => {
      const converted = to(
        {
          space: ColorSpaceMap[source],
          coords: [red / 255, green / 255, blue / 255],
        },
        ColorSpaceMap[target],
      );

      const coords = Schema.decodeUnknownSync(VideoClip.RGB)(converted.coords);

      return [coords[0] * 255, coords[1] * 255, coords[2] * 255, alpha] satisfies VideoClip.RGBA;
    };

    return globalThis.Array.from({ length: bitmap.length }, (_, y) => {
      const row = bitmap[y]!;

      return globalThis.Array.from({ length: row.length }, (_, x) => mapper(row[x]!));
    });
  };
}
