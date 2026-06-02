import * as color from "@texel/color";
import { Number } from "effect";

export namespace VideoColor {
  /** Normalized RGBA color. RGB and alpha channels are all in the range 0..1. */
  export type RGBA = readonly [red: number, green: number, blue: number, alpha: number];

  export const ColorSpace = {
    srgb: color.sRGB,
    "display-p3": color.DisplayP3,
  };
  export type ColorSpace = keyof typeof ColorSpace;
  export const DefaultColorSpace = "srgb" as const satisfies ColorSpace;

  export const Transparent: RGBA = [0, 0, 0, 0];
  export const Black: RGBA = [0, 0, 0, 1];
  export const White: RGBA = [1, 1, 1, 1];

  export const rgba = (red: number, green: number, blue: number, alpha = 1): RGBA =>
    [unit(red), unit(green), unit(blue), unit(alpha)];

  export const rgb = (red: number, green: number, blue: number): RGBA => rgba(red, green, blue);

  export const byte = (red: number, green: number, blue: number, alpha = 255): RGBA =>
    rgba(red / 255, green / 255, blue / 255, alpha / 255);

  export const hsl = (
    hue: number,
    saturation: number,
    lightness: number,
    alpha = 1,
    colorSpace: ColorSpace = DefaultColorSpace,
  ): RGBA =>
    rgba(
      ...(color.convert([hue, saturation, lightness], color.OKHSL, ColorSpace[colorSpace]) as [number, number, number]),
      alpha,
    );

  export const lch = (
    lightness: number,
    chroma: number,
    hue: number,
    alpha = 1,
    colorSpace: ColorSpace = DefaultColorSpace,
  ): RGBA =>
    rgba(
      ...(color.convert([lightness, chroma, hue], color.OKLCH, ColorSpace[colorSpace]) as [number, number, number]),
      alpha,
    );

  export const convert = (value: RGBA, source: ColorSpace, target: ColorSpace): RGBA => {
    if (source === target) return value;

    const [red, green, blue] = color.convert(
      [value[0], value[1], value[2]],
      ColorSpace[source],
      ColorSpace[target],
    ) as [number, number, number];

    return rgba(red, green, blue, value[3]);
  };

  export const unit = Number.clamp({ minimum: 0, maximum: 1 });
}
