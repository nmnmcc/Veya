import { P3, P3_Linear, sRGB, sRGB_Linear, to } from "colorjs.io/fn";
import type { RGBColorSpace } from "colorjs.io/fn";
import { Context, Layer } from "effect";

import { type VideoClip, VideoColorSpace } from "@veya/core";

export class VideoColorSpaceConverter extends Context.Service<
  VideoColorSpaceConverter,
  VideoColorSpaceConverter.VideoColorGamutConverter
>()("@veya/video/VideoColorGamutConverter") {}

export namespace VideoColorSpaceConverter {
  export const ColorSpaceMap = {
    "display-p3": P3,
    "display-p3-linear": P3_Linear,
    srgb: sRGB,
    "srgb-linear": sRGB_Linear,
  } as const satisfies Record<VideoColorSpace.VideoColorSpace, RGBColorSpace>;

  export interface Options {
    readonly source?: VideoColorSpace.VideoColorSpace | undefined;
    readonly target?: VideoColorSpace.VideoColorSpace | undefined;
  }

  export interface VideoColorGamutConverter {
    readonly convert: (bitmap: VideoClip.Bitmap, options: Options) => VideoClip.Bitmap;
  }

  export const make = (): VideoColorGamutConverter => ({
    convert,
  });

  export const layer = Layer.succeed(VideoColorSpaceConverter, make());

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
          coords: [red, green, blue],
          alpha,
        },
        ColorSpaceMap[target],
      );

      return [...converted.coords, converted.alpha] as VideoClip.RGBA;
    };

    return globalThis.Array.from({ length: bitmap.length }, (_, y) => {
      const row = bitmap[y]!;

      return globalThis.Array.from({ length: row.length }, (_, x) => mapper(row[x]!));
    });
  };
}
