import { identity, Iterable } from "effect";

import type { Size } from "./Base";
import { VideoColor } from "./VideoColor";

export type VideoFrame = Uint8ClampedArray<ArrayBuffer>;

export namespace VideoFrame {
  export const make = (size: Size, [red, green, blue, alpha]: VideoColor.RGBA = VideoColor.Transparent): VideoFrame => {
    const frame = new Uint8ClampedArray(area(size) * 4);

    if (red === 0 && green === 0 && blue === 0 && alpha === 0) {
      return frame;
    }

    for (let start = 0; start < frame.length; start += 4) {
      frame[start + 0] = red;
      frame[start + 1] = green;
      frame[start + 2] = blue;
      frame[start + 3] = alpha;
    }

    return frame;
  };

  export const colors = (colors: Iterable<VideoColor.RGBA>): VideoFrame => {
    return new Uint8ClampedArray(Iterable.flatMap(colors, identity));
  };

  export const fn = ([width, height]: Size, colorAt: (x: number, y: number) => VideoColor.RGBA): VideoFrame => {
    const channels = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const start = offset(width, x, y);
        const [red, green, blue, alpha] = colorAt(x, y);

        channels[start + 0] = red;
        channels[start + 1] = green;
        channels[start + 2] = blue;
        channels[start + 3] = alpha;
      }
    }

    return channels;
  };

  export const get = (frame: VideoFrame, [width]: Size, x: number, y: number): VideoColor.RGBA => {
    const start = offset(width, x, y);

    return VideoColor.rgba(frame[start + 0]!, frame[start + 1]!, frame[start + 2]!, frame[start + 3]!);
  };

  export const set = (
    frame: VideoFrame,
    [width]: Size,
    x: number,
    y: number,
    [red, green, blue, alpha]: VideoColor.RGBA,
  ): void => {
    const start = offset(width, x, y);

    frame[start + 0] = red;
    frame[start + 1] = green;
    frame[start + 2] = blue;
    frame[start + 3] = alpha;
  };

  export const fit = (frame: VideoFrame, sourceSize: Size, targetSize: Size): VideoFrame => {
    const [sourceWidth, sourceHeight] = sourceSize;
    const [targetWidth, targetHeight] = targetSize;

    if (sourceWidth === targetWidth && sourceHeight === targetHeight) return frame;

    const target = new Uint8ClampedArray(area(targetSize) * 4);
    const width = Math.min(sourceWidth, targetWidth);
    const height = Math.min(sourceHeight, targetHeight);
    const rowChannels = width * 4;

    for (let y = 0; y < height; y += 1) {
      const sourceOffset = offset(sourceWidth, 0, y);
      const targetOffset = offset(targetWidth, 0, y);

      target.set(frame.subarray(sourceOffset, sourceOffset + rowChannels), targetOffset);
    }

    return target;
  };

  export const convertColorSpace = (
    frame: VideoFrame,
    options: {
      readonly source?: VideoColor.ColorSpace | undefined;
      readonly target: VideoColor.ColorSpace;
    },
  ): VideoFrame => {
    const source = options.source ?? VideoColor.DefaultColorSpace;
    const target = options.target;
    if (source === target) return frame;

    const converted = new Uint8ClampedArray(frame.length);
    for (let index = 0; index < frame.length; index += 4) {
      const [red, green, blue, alpha] = VideoColor.convert(
        VideoColor.rgba(frame[index + 0]!, frame[index + 1]!, frame[index + 2]!, frame[index + 3]!),
        source,
        target,
      );

      converted[index + 0] = red;
      converted[index + 1] = green;
      converted[index + 2] = blue;
      converted[index + 3] = alpha;
    }

    return converted;
  };

  const area = ([width, height]: Size): number => width * height;

  const offset = (width: number, x: number, y: number): number => (y * width + x) * 4;
}
