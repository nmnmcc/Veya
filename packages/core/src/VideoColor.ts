import { convert as _convert, DisplayP3, floatToByte, OKHSL, OKLCH, sRGB } from "@texel/color";
import { Number } from "effect";

export namespace VideoColor {
  export type RGB = readonly [red: number, green: number, blue: number];
  /** Byte RGBA color. RGB and alpha channels are all integers in the range 0..255. */
  export type RGBA = readonly [red: number, green: number, blue: number, alpha: number];

  export const ColorSpace = {
    srgb: sRGB,
    "display-p3": DisplayP3,
  };
  export type ColorSpace = keyof typeof ColorSpace;
  export const DefaultColorSpace = "srgb" as const satisfies ColorSpace;

  export const Transparent: RGBA = [0, 0, 0, 0];
  export const Black: RGBA = [0, 0, 0, 255];
  export const White: RGBA = [255, 255, 255, 255];

  export const rgba = (red: number, green: number, blue: number, alpha = 255): RGBA => [red, green, blue, alpha];

  export const rgb = (red: number, green: number, blue: number): RGBA => rgba(red, green, blue);

  export const hsl = (
    hue: number,
    saturation: number,
    lightness: number,
    alpha = 255,
    colorSpace: ColorSpace = DefaultColorSpace,
  ): RGBA => [...toBytes(_convert([hue, saturation, lightness], OKHSL, ColorSpace[colorSpace])), alpha] as never;

  export const lch = (
    lightness: number,
    chroma: number,
    hue: number,
    alpha = 255,
    colorSpace: ColorSpace = DefaultColorSpace,
  ): RGBA => [...toBytes(_convert([lightness, chroma, hue], OKLCH, ColorSpace[colorSpace])), alpha] as never;

  export const convert = (value: RGBA, source: ColorSpace, target: ColorSpace): RGBA => {
    if (source === target) return value;
    return [..._convert([value[0], value[1], value[2]], ColorSpace[source], ColorSpace[target]), value[3]] as never;
  };

  export const blend = (source: RGBA, destination: RGBA): RGBA => {
    const _source = toFloats(source);
    const _destination = toFloats(destination);

    const sa = _source[3];
    if (sa === 0) return destination;

    const da = _destination[3];
    if (sa === 1 || da === 0) return source;

    const a = sa + da * (1 - sa);
    if (a === 0) return Transparent;

    const _blend = (sc: number, dc: number): number => (sc * sa + dc * da * (1 - sa)) / a;

    return [
      _blend(source[0], destination[0]),
      _blend(source[1], destination[1]),
      _blend(source[2], destination[2]),
      floatToByte(a),
    ];
  };

  const toBytes = <T extends readonly number[]>(floats: T): T => floats.map(floatToByte) as never;

  const toFloats = <T extends readonly number[]>(bytes: T): T =>
    bytes.map(Number.clamp({ minimum: 0, maximum: 1 })).map((n) => n / 255) as never;
}
