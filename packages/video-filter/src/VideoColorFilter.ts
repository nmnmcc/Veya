import type { VideoClip } from "@veya/core";

import { VideoFilter } from "./VideoFilter";

export namespace VideoColorFilter {
  export interface ThresholdOptions {
    /** Luminance cutoff in the 0-255 range. Defaults to 128. */
    readonly level?: number | undefined;
    /** Color used below the cutoff. Defaults to opaque black. */
    readonly low?: VideoClip.RGBA | undefined;
    /** Color used at or above the cutoff. Defaults to opaque white. */
    readonly high?: VideoClip.RGBA | undefined;
    /** Whether to keep each source pixel's alpha channel. Defaults to true. */
    readonly preserveAlpha?: boolean | undefined;
  }

  /** Desaturates pixels. Use `0` for no effect and `1` for full grayscale. */
  export const grayscale = (amount = 1): VideoFilter.Filter => {
    const mixAmount = VideoFilter.clampUnit(amount);

    return VideoFilter.mapPixels(([red, green, blue, alpha]) => {
      const gray = VideoFilter.getLuminance(red, green, blue);

      return VideoFilter.rgba(
        VideoFilter.mix(red, gray, mixAmount),
        VideoFilter.mix(green, gray, mixAmount),
        VideoFilter.mix(blue, gray, mixAmount),
        alpha,
      );
    });
  };

  /** Applies a sepia tone. Use `0` for no effect and `1` for full sepia. */
  export const sepia = (amount = 1): VideoFilter.Filter => {
    const mixAmount = VideoFilter.clampUnit(amount);

    return VideoFilter.mapPixels(([red, green, blue, alpha]) => {
      const sepiaRed = red * 0.393 + green * 0.769 + blue * 0.189;
      const sepiaGreen = red * 0.349 + green * 0.686 + blue * 0.168;
      const sepiaBlue = red * 0.272 + green * 0.534 + blue * 0.131;

      return VideoFilter.rgba(
        VideoFilter.mix(red, sepiaRed, mixAmount),
        VideoFilter.mix(green, sepiaGreen, mixAmount),
        VideoFilter.mix(blue, sepiaBlue, mixAmount),
        alpha,
      );
    });
  };

  /** Inverts colors. Use `0` for no effect and `1` for full inversion. */
  export const invert = (amount = 1): VideoFilter.Filter => {
    const mixAmount = VideoFilter.clampUnit(amount);

    return VideoFilter.mapPixels(([red, green, blue, alpha]) =>
      VideoFilter.rgba(
        VideoFilter.mix(red, 255 - red, mixAmount),
        VideoFilter.mix(green, 255 - green, mixAmount),
        VideoFilter.mix(blue, 255 - blue, mixAmount),
        alpha,
      ),
    );
  };

  /** Multiplies RGB channels to make the frame darker or brighter. */
  export const brightness = (amount = 1): VideoFilter.Filter => {
    const multiplier = VideoFilter.finiteOr(amount, 1);

    return VideoFilter.mapPixels(([red, green, blue, alpha]) =>
      VideoFilter.rgba(red * multiplier, green * multiplier, blue * multiplier, alpha),
    );
  };

  /** Adjusts contrast around the midpoint of each RGB channel. */
  export const contrast = (amount = 1): VideoFilter.Filter => {
    const multiplier = VideoFilter.finiteOr(amount, 1);

    return VideoFilter.mapPixels(([red, green, blue, alpha]) =>
      VideoFilter.rgba(
        (red - 128) * multiplier + 128,
        (green - 128) * multiplier + 128,
        (blue - 128) * multiplier + 128,
        alpha,
      ),
    );
  };

  /** Adjusts color saturation. Use `0` for grayscale and `1` to keep the source saturation. */
  export const saturate = (amount = 1): VideoFilter.Filter => {
    const multiplier = VideoFilter.finiteOr(amount, 1);

    return VideoFilter.mapPixels(([red, green, blue, alpha]) => {
      const gray = VideoFilter.getLuminance(red, green, blue);

      return VideoFilter.rgba(
        gray + (red - gray) * multiplier,
        gray + (green - gray) * multiplier,
        gray + (blue - gray) * multiplier,
        alpha,
      );
    });
  };

  /** Rotates pixel hue by the requested number of degrees. */
  export const hueRotate = (degrees: number): VideoFilter.Filter => {
    const normalizedDegrees = VideoFilter.finiteOr(degrees, 0);

    return VideoFilter.mapPixels(([red, green, blue, alpha]) => {
      const [hue, saturation, lightness] = rgbToHsl(red, green, blue);

      return hslToRgba(hue + normalizedDegrees, saturation, lightness, alpha);
    });
  };

  /** Multiplies each pixel's alpha channel. */
  export const opacity = (amount = 1): VideoFilter.Filter => {
    const multiplier = VideoFilter.finiteOr(amount, 1);

    return VideoFilter.mapPixels(([red, green, blue, alpha]) => VideoFilter.rgba(red, green, blue, alpha * multiplier));
  };

  /** Converts pixels to low or high colors based on luminance. */
  export const threshold = (options: number | ThresholdOptions = {}): VideoFilter.Filter => {
    const normalized = typeof options === "number" ? { level: options } : options;
    const level = VideoFilter.clampChannel(normalized.level ?? 128);
    const low = VideoFilter.normalizePixel(normalized.low ?? [0, 0, 0, 1]);
    const high = VideoFilter.normalizePixel(normalized.high ?? [255, 255, 255, 1]);
    const preserveAlpha = normalized.preserveAlpha ?? true;

    return VideoFilter.mapPixels(([red, green, blue, alpha]) => {
      const color = VideoFilter.getLuminance(red, green, blue) >= level ? high : low;

      return VideoFilter.rgba(color[0], color[1], color[2], preserveAlpha ? alpha : color[3]);
    });
  };

  /** Applies gamma correction. Values above 1 brighten midtones; values below 1 darken them. */
  export const gamma = (amount = 1): VideoFilter.Filter => {
    const correction = Math.max(0.01, VideoFilter.finiteOr(amount, 1));
    const exponent = 1 / correction;

    return VideoFilter.mapPixels(([red, green, blue, alpha]) =>
      VideoFilter.rgba(
        255 * Math.pow(red / 255, exponent),
        255 * Math.pow(green / 255, exponent),
        255 * Math.pow(blue / 255, exponent),
        alpha,
      ),
    );
  };

  /** Blends each pixel toward a target color. */
  export const tint = (color: VideoClip.RGBA, amount = 1): VideoFilter.Filter => {
    const target = VideoFilter.normalizePixel(color);
    const mixAmount = VideoFilter.clampUnit(amount * target[3]);

    return VideoFilter.mapPixels(([red, green, blue, alpha]) =>
      VideoFilter.rgba(
        VideoFilter.mix(red, target[0], mixAmount),
        VideoFilter.mix(green, target[1], mixAmount),
        VideoFilter.mix(blue, target[2], mixAmount),
        alpha,
      ),
    );
  };
}

const rgbToHsl = (
  red: number,
  green: number,
  blue: number,
): readonly [hue: number, saturation: number, lightness: number] => {
  const normalizedRed = red / 255;
  const normalizedGreen = green / 255;
  const normalizedBlue = blue / 255;
  const max = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
  const min = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
  const lightness = (max + min) / 2;
  const chroma = max - min;

  if (chroma === 0) {
    return [0, 0, lightness];
  }

  const saturation = chroma / (1 - Math.abs(2 * lightness - 1));
  const hue =
    max === normalizedRed
      ? 60 * (((normalizedGreen - normalizedBlue) / chroma) % 6)
      : max === normalizedGreen
        ? 60 * ((normalizedBlue - normalizedRed) / chroma + 2)
        : 60 * ((normalizedRed - normalizedGreen) / chroma + 4);

  return [VideoFilter.wrapDegrees(hue), saturation, lightness];
};

const hslToRgba = (hue: number, saturation: number, lightness: number, alpha: number): VideoClip.RGBA => {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = VideoFilter.wrapDegrees(hue) / 60;
  const secondLargest = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = lightness - chroma / 2;
  const [red, green, blue] =
    segment < 1
      ? [chroma, secondLargest, 0]
      : segment < 2
        ? [secondLargest, chroma, 0]
        : segment < 3
          ? [0, chroma, secondLargest]
          : segment < 4
            ? [0, secondLargest, chroma]
            : segment < 5
              ? [secondLargest, 0, chroma]
              : [chroma, 0, secondLargest];

  return VideoFilter.rgba((red + match) * 255, (green + match) * 255, (blue + match) * 255, alpha);
};
