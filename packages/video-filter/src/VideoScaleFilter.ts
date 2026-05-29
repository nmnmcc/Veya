import type { Size, VideoClip } from "@veya/core";

import { VideoFilter } from "./VideoFilter";

export namespace VideoScaleFilter {
  /** Pixel sampling algorithm used while resizing frames. */
  export type Algorithm = "nearest" | "bilinear";

  /** Strategy for fitting a source frame into a target size. */
  export type FitMode = "contain" | "cover" | "fill";

  /** Uniform scale factor or separate horizontal and vertical scale factors. */
  export type ScaleFactor = number | readonly [scaleX: number, scaleY: number];

  export interface ResizeOptions {
    /** Sampling algorithm. Defaults to `bilinear`. */
    readonly algorithm?: Algorithm | undefined;
  }

  export interface FitOptions extends ResizeOptions {
    /** Fit strategy. Defaults to `contain`. */
    readonly mode?: FitMode | undefined;
    /** Background color used when `contain` leaves empty space. Defaults to transparent. */
    readonly background?: VideoClip.RGBA | undefined;
  }

  export type FixedFitOptions = Omit<FitOptions, "mode">;

  /** Resizes every frame to an exact target size. */
  export const resize = (size: Size, options: ResizeOptions = {}): VideoFilter.Filter => {
    const target = normalizeSize(size);
    const algorithm = options.algorithm ?? "bilinear";

    return (bitmap) => resizeBitmap(bitmap, target, algorithm);
  };

  /** Scales every frame by a uniform or per-axis factor. */
  export const scale = (factor: ScaleFactor, options: ResizeOptions = {}): VideoFilter.Filter => {
    const [scaleX, scaleY] = normalizeScaleFactor(factor);
    const algorithm = options.algorithm ?? "bilinear";

    return (bitmap) => {
      const { height, width } = VideoFilter.getBitmapSize(bitmap);
      const target: Size = [Math.max(0, Math.round(width * scaleX)), Math.max(0, Math.round(height * scaleY))];

      return resizeBitmap(bitmap, target, algorithm);
    };
  };

  /** Fits every frame into a target size using `contain`, `cover`, or `fill`. */
  export const fit = (size: Size, options: FitOptions = {}): VideoFilter.Filter => {
    const target = normalizeSize(size);
    const mode = options.mode ?? "contain";
    const algorithm = options.algorithm ?? "bilinear";
    const background = VideoFilter.normalizePixel(options.background ?? [0, 0, 0, 0]);

    if (mode === "fill") {
      return resize(target, { algorithm });
    }

    return (bitmap) => {
      const source = VideoFilter.getBitmapSize(bitmap);

      if (target[0] === 0 || target[1] === 0) {
        return [];
      }

      if (source.width === 0 || source.height === 0) {
        return makeBitmap(target, background);
      }

      const scale =
        mode === "cover"
          ? Math.max(target[0] / source.width, target[1] / source.height)
          : Math.min(target[0] / source.width, target[1] / source.height);
      const scaledSize: Size = [
        Math.max(1, Math.round(source.width * scale)),
        Math.max(1, Math.round(source.height * scale)),
      ];
      const scaled = resizeBitmap(bitmap, scaledSize, algorithm);

      return mode === "cover" ? cropCenter(scaled, target, algorithm) : placeCenter(scaled, target, background);
    };
  };

  /** Fits the full source frame inside the target size and pads empty space. */
  export const contain = (size: Size, options: FixedFitOptions = {}): VideoFilter.Filter => {
    return fit(size, { ...options, mode: "contain" });
  };

  /** Fills the target size and crops any overflow from the center. */
  export const cover = (size: Size, options: FixedFitOptions = {}): VideoFilter.Filter => {
    return fit(size, { ...options, mode: "cover" });
  };
}

const resizeBitmap = (
  bitmap: VideoClip.Bitmap,
  [targetWidth, targetHeight]: Size,
  algorithm: VideoScaleFilter.Algorithm,
): VideoClip.Bitmap => {
  if (targetWidth === 0 || targetHeight === 0) {
    return [];
  }

  const source = VideoFilter.getBitmapSize(bitmap);

  if (source.width === 0 || source.height === 0) {
    return makeBitmap([targetWidth, targetHeight], [0, 0, 0, 0]);
  }

  return globalThis.Array.from({ length: targetHeight }, (_, y) =>
    globalThis.Array.from({ length: targetWidth }, (_, x) => {
      const sourceX = ((x + 0.5) * source.width) / targetWidth - 0.5;
      const sourceY = ((y + 0.5) * source.height) / targetHeight - 0.5;

      return algorithm === "nearest"
        ? sampleNearest(bitmap, sourceX, sourceY)
        : sampleBilinear(bitmap, sourceX, sourceY);
    }),
  );
};

const cropCenter = (
  bitmap: VideoClip.Bitmap,
  [targetWidth, targetHeight]: Size,
  algorithm: VideoScaleFilter.Algorithm,
): VideoClip.Bitmap => {
  const source = VideoFilter.getBitmapSize(bitmap);
  const offsetX = (source.width - targetWidth) / 2;
  const offsetY = (source.height - targetHeight) / 2;

  return globalThis.Array.from({ length: targetHeight }, (_, y) =>
    globalThis.Array.from({ length: targetWidth }, (_, x) => {
      const sourceX = x + offsetX;
      const sourceY = y + offsetY;

      return algorithm === "nearest"
        ? sampleNearest(bitmap, sourceX, sourceY)
        : sampleBilinear(bitmap, sourceX, sourceY);
    }),
  );
};

const placeCenter = (
  bitmap: VideoClip.Bitmap,
  [targetWidth, targetHeight]: Size,
  background: VideoClip.RGBA,
): VideoClip.Bitmap => {
  const source = VideoFilter.getBitmapSize(bitmap);
  const offsetX = Math.floor((targetWidth - source.width) / 2);
  const offsetY = Math.floor((targetHeight - source.height) / 2);

  return globalThis.Array.from({ length: targetHeight }, (_, y) =>
    globalThis.Array.from({ length: targetWidth }, (_, x) => {
      const sourceX = x - offsetX;
      const sourceY = y - offsetY;

      if (sourceX < 0 || sourceX >= source.width || sourceY < 0 || sourceY >= source.height) {
        return background;
      }

      return VideoFilter.readPixel(bitmap, sourceX, sourceY);
    }),
  );
};

const makeBitmap = ([width, height]: Size, color: VideoClip.RGBA): VideoClip.Bitmap => {
  return globalThis.Array.from({ length: height }, () => globalThis.Array.from({ length: width }, () => [...color]));
};

const sampleNearest = (bitmap: VideoClip.Bitmap, x: number, y: number): VideoClip.RGBA => {
  return VideoFilter.readPixel(bitmap, Math.round(x), Math.round(y));
};

const sampleBilinear = (bitmap: VideoClip.Bitmap, x: number, y: number): VideoClip.RGBA => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const dx = x - x0;
  const dy = y - y0;
  const topLeft = VideoFilter.readPixel(bitmap, x0, y0);
  const topRight = VideoFilter.readPixel(bitmap, x1, y0);
  const bottomLeft = VideoFilter.readPixel(bitmap, x0, y1);
  const bottomRight = VideoFilter.readPixel(bitmap, x1, y1);

  return VideoFilter.rgba(
    bilinear(topLeft[0], topRight[0], bottomLeft[0], bottomRight[0], dx, dy),
    bilinear(topLeft[1], topRight[1], bottomLeft[1], bottomRight[1], dx, dy),
    bilinear(topLeft[2], topRight[2], bottomLeft[2], bottomRight[2], dx, dy),
    bilinear(topLeft[3], topRight[3], bottomLeft[3], bottomRight[3], dx, dy),
  );
};

const bilinear = (
  topLeft: number,
  topRight: number,
  bottomLeft: number,
  bottomRight: number,
  dx: number,
  dy: number,
): number => {
  const top = VideoFilter.mix(topLeft, topRight, dx);
  const bottom = VideoFilter.mix(bottomLeft, bottomRight, dx);

  return VideoFilter.mix(top, bottom, dy);
};

const normalizeSize = ([width, height]: Size): Size => {
  return [normalizeLength(width), normalizeLength(height)];
};

const normalizeLength = (value: number): number => {
  return Math.max(0, Math.round(VideoFilter.finiteOr(value, 0)));
};

const normalizeScaleFactor = (factor: VideoScaleFilter.ScaleFactor): readonly [scaleX: number, scaleY: number] => {
  if (typeof factor === "number") {
    const scale = normalizeScale(factor);

    return [scale, scale];
  }

  return [normalizeScale(factor[0]), normalizeScale(factor[1])];
};

const normalizeScale = (value: number): number => {
  return Math.max(0, VideoFilter.finiteOr(value, 1));
};
