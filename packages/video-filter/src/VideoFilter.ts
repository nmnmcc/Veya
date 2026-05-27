import { Stream } from "effect";

import type { VideoClip } from "@veya/core";

export namespace VideoFilter {
  export type Filter = (bitmap: VideoClip.Bitmap) => VideoClip.Bitmap;

  export interface PixelContext {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }

  export type PixelMapper = (pixel: VideoClip.RGBA, context: PixelContext) => VideoClip.RGBA;

  export interface VideoFilter<E = never, R = never> extends VideoClip.VideoClip<E, R> {}

  export const make = <E = never, R = never>(
    clip: VideoClip.VideoClip<E, R>,
    filters: readonly Filter[],
  ): VideoFilter<E, R> => Stream.map(clip, compose(filters));

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

  export const normalizePixel = (pixel: VideoClip.RGBA | undefined): VideoClip.RGBA => {
    return rgba(pixel?.[0] ?? 0, pixel?.[1] ?? 0, pixel?.[2] ?? 0, pixel?.[3] ?? 0);
  };

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

  export const rgba = (red: number, green: number, blue: number, alpha: number): VideoClip.RGBA => {
    return [clampChannel(red), clampChannel(green), clampChannel(blue), clampChannel(alpha)];
  };

  export const getLuminance = (red: number, green: number, blue: number): number => {
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  };

  export const mix = (from: number, to: number, amount: number): number => {
    return from + (to - from) * amount;
  };

  export const smoothstep = (edge0: number, edge1: number, value: number): number => {
    const range = edge1 - edge0;

    if (range === 0) {
      return value < edge0 ? 0 : 1;
    }

    const x = clampUnit((value - edge0) / range);

    return x * x * (3 - 2 * x);
  };

  export const wrapDegrees = (degrees: number): number => {
    return ((degrees % 360) + 360) % 360;
  };

  export const clampUnit = (value: number): number => {
    return clamp(finiteOr(value, 0), 0, 1);
  };

  export const clampChannel = (value: number): number => {
    return Math.round(clamp(finiteOr(value, 0), 0, 255));
  };

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
