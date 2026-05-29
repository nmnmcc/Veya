import { Stream } from "effect";

import type { VideoClip, VideoTick } from "@veya/core";

export namespace VideoFilter {
  export interface VideoFilter<
    I = VideoTick,
    IE = never,
    IR = never,
    OE = never,
    OR = never,
  > extends VideoClip.VideoClip<I, IE, IR, OE, OR> {}

  export type Filter = (bitmap: VideoClip.Bitmap) => VideoClip.Bitmap;

  export interface PixelContext {
    /** Zero-based horizontal pixel coordinate. */
    readonly x: number;
    /** Zero-based vertical pixel coordinate. */
    readonly y: number;
    /** Frame width in pixels. */
    readonly width: number;
    /** Frame height in pixels. */
    readonly height: number;
  }

  export type PixelMapper = (pixel: VideoClip.RGBA, context: PixelContext) => VideoClip.RGBA;

  export const make =
    <I = VideoTick, IE = never, IR = never, OE = never, OR = never>(
      clip: VideoClip.VideoClip<I, IE, IR, OE, OR>,
      filters: readonly Filter[],
    ): VideoFilter<I, IE, IR, OE, OR> =>
    (stream) =>
      Stream.map(clip(stream), compose(filters));

  export const apply = (bitmap: VideoClip.Bitmap, filters: readonly Filter[]): VideoClip.Bitmap => {
    return compose(filters)(bitmap);
  };

  export const compose = (filters: readonly Filter[]): Filter => {
    return (bitmap) => filters.reduce((frame, filter) => filter(frame), bitmap);
  };

  export const identity = (): Filter => {
    return (bitmap) => bitmap;
  };

  export const mapPixels = (mapper: PixelMapper): Filter => {
    return (bitmap) => {
      const { height, width } = getBitmapSize(bitmap);

      return globalThis.Array.from({ length: height }, (_, y) => {
        const row = bitmap[y] ?? [];

        return globalThis.Array.from({ length: row.length }, (_, x) =>
          mapper(normalizePixel(row[x]), { height, width, x, y }),
        );
      });
    };
  };

  export const getBitmapSize = (bitmap: VideoClip.Bitmap): { readonly height: number; readonly width: number } => {
    return {
      height: bitmap.length,
      width: bitmap[0]?.length ?? 0,
    };
  };

  /** Converts a possibly missing pixel into a valid transparent RGBA pixel. */
  export const normalizePixel = (pixel: VideoClip.RGBA | undefined): VideoClip.RGBA => {
    return rgba(pixel?.[0] ?? 0, pixel?.[1] ?? 0, pixel?.[2] ?? 0, pixel?.[3] ?? 0);
  };

  /** Reads a pixel, clamping coordinates to the nearest pixel inside the bitmap. */
  export const readPixel = (bitmap: VideoClip.Bitmap, x: number, y: number): VideoClip.RGBA => {
    if (bitmap.length === 0) {
      return [0, 0, 0, 0];
    }

    const clampedY = clampInteger(y, 0, bitmap.length - 1);
    const row = bitmap[clampedY];

    if (!row || row.length === 0) {
      return [0, 0, 0, 0];
    }

    const clampedX = clampInteger(x, 0, row.length - 1);

    return normalizePixel(row[clampedX]);
  };

  /** Creates an RGBA pixel with RGB clamped to byte values and alpha clamped to `[0, 1]`. */
  export const rgba = (red: number, green: number, blue: number, alpha: number): VideoClip.RGBA => {
    return [clampChannel(red), clampChannel(green), clampChannel(blue), clampUnit(alpha)];
  };

  /** Computes relative luminance from RGB channels. */
  export const getLuminance = (red: number, green: number, blue: number): number => {
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  };

  export const mix = (from: number, to: number, amount: number): number => {
    return from + (to - from) * amount;
  };

  /** Smoothly interpolates from 0 to 1 between two edge values. */
  export const smoothstep = (edge0: number, edge1: number, value: number): number => {
    const range = edge1 - edge0;

    if (range === 0) {
      return value < edge0 ? 0 : 1;
    }

    const x = clampUnit((value - edge0) / range);

    return x * x * (3 - 2 * x);
  };

  /** Wraps any degree value into the `[0, 360)` range. */
  export const wrapDegrees = (degrees: number): number => {
    return ((degrees % 360) + 360) % 360;
  };

  /** Clamps a number into the `[0, 1]` range, replacing non-finite values with 0. */
  export const clampUnit = (value: number): number => {
    return clamp(finiteOr(value, 0), 0, 1);
  };

  /** Clamps a number into the `[0, 255]` range and rounds it to an integer. */
  export const clampChannel = (value: number): number => {
    return Math.round(clamp(finiteOr(value, 0), 0, 255));
  };

  /** Clamps a number into an integer range. */
  export const clampInteger = (value: number, min: number, max: number): number => {
    return Math.round(clamp(finiteOr(value, min), min, max));
  };

  export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(max, Math.max(min, value));
  };

  export const finiteOr = (value: number, fallback: number): number => {
    return Number.isFinite(value) ? value : fallback;
  };
}
