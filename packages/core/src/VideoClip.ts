import { Effect, Stream } from "effect";

import type { Clip, Size } from "./Base";
import { Encodable } from "./Encodable";
import { VideoColor } from "./VideoColor";
import { VideoContext } from "./VideoContext";

export namespace VideoClip {
  export type Pixel = Uint8ClampedArray<ArrayBuffer>;
  export type Bitmap = Uint8ClampedArray<ArrayBuffer>;

  export type VideoClip<I, IE = never, IR = never, OE = never, OR = never> = Clip<
    VideoContext.VideoContext,
    I,
    Bitmap,
    IE,
    IR,
    OE,
    OR
  >;

  export type Encodable<E = never, R = never> = ReturnType<VideoClip<never, never, never, E, R>>;

  const toByte = (value: number): number => Math.round(VideoColor.unit(value) * 255);

  export const Pixel = {
    fromColor: (color: VideoColor.RGBA): Pixel => {
      const pixel = new Uint8ClampedArray(4);

      pixel[0] = toByte(color[0]);
      pixel[1] = toByte(color[1]);
      pixel[2] = toByte(color[2]);
      pixel[3] = toByte(color[3]);

      return pixel;
    },
    toColor: (pixel: Pixel): VideoColor.RGBA =>
      VideoColor.byte(pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0, pixel[3] ?? 0),
    make: (red: number, green: number, blue: number, alpha = 1): Pixel =>
      Pixel.fromColor(VideoColor.rgba(red, green, blue, alpha)),
  };

  /** Creates a video clip from a stream transformer. */
  export const make = <I, IE = never, IR = never, OE = never, OR = never>(
    clip: (stream: Stream.Stream<I, IE, IR>) => Stream.Stream<Bitmap, OE, OR>,
  ): Effect.Effect<VideoClip<I, IE, IR, OE, Exclude<OR, VideoContext>>, never, VideoContext> =>
    Effect.gen(function* () {
      const context = yield* VideoContext;

      return (stream) => Encodable.make(clip(stream).pipe(Stream.provideService(VideoContext, context)), context);
    });

  export namespace Bitmap {
    export const make = (size: Size, pixel: Pixel = Pixel.fromColor(VideoColor.Transparent)): Bitmap => {
      const bitmap = new Uint8ClampedArray(area(size) * 4);

      if ((pixel[0] ?? 0) === 0 && (pixel[1] ?? 0) === 0 && (pixel[2] ?? 0) === 0 && (pixel[3] ?? 0) === 0) {
        return bitmap;
      }

      for (let start = 0; start < bitmap.length; start += 4) {
        bitmap[start + 0] = pixel[0] ?? 0;
        bitmap[start + 1] = pixel[1] ?? 0;
        bitmap[start + 2] = pixel[2] ?? 0;
        bitmap[start + 3] = pixel[3] ?? 0;
      }

      return bitmap;
    };

    export const fromPixelsUnsafe = (pixels: Iterable<Pixel>): Bitmap => {
      const channels: number[] = [];

      for (const pixel of pixels) {
        channels.push(pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0, pixel[3] ?? 0);
      }

      return new Uint8ClampedArray(channels);
    };

    export const fromFunction = ([width, height]: Size, pixelAt: (x: number, y: number) => Pixel): Bitmap => {
      const channels = new Uint8ClampedArray(width * height * 4);

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const pixel = pixelAt(x, y);
          const start = offset(width, x, y);

          channels[start + 0] = pixel[0] ?? 0;
          channels[start + 1] = pixel[1] ?? 0;
          channels[start + 2] = pixel[2] ?? 0;
          channels[start + 3] = pixel[3] ?? 0;
        }
      }

      return channels;
    };

    export const fromChannelsUnsafe = (channels: ArrayLike<number>): Bitmap =>
      channels instanceof Uint8ClampedArray ? (channels as Bitmap) : new Uint8ClampedArray(channels);

    export const get = (bitmap: Bitmap, [width]: Size, x: number, y: number): Pixel => {
      const start = offset(width, x, y);
      const pixel = new Uint8ClampedArray(4);

      pixel[0] = bitmap[start + 0] ?? 0;
      pixel[1] = bitmap[start + 1] ?? 0;
      pixel[2] = bitmap[start + 2] ?? 0;
      pixel[3] = bitmap[start + 3] ?? 0;

      return pixel;
    };

    export const set = (bitmap: MutableChannels, [width]: Size, x: number, y: number, pixel: Pixel): void => {
      const start = offset(width, x, y);

      bitmap[start + 0] = pixel[0] ?? 0;
      bitmap[start + 1] = pixel[1] ?? 0;
      bitmap[start + 2] = pixel[2] ?? 0;
      bitmap[start + 3] = pixel[3] ?? 0;
    };

    export const fit = (bitmap: Bitmap, sourceSize: Size, targetSize: Size): Bitmap => {
      const [sourceWidth, sourceHeight] = sourceSize;
      const [targetWidth, targetHeight] = targetSize;

      if (sourceWidth === targetWidth && sourceHeight === targetHeight) return bitmap;

      const target = new Uint8ClampedArray(area(targetSize) * 4);
      const width = Math.min(sourceWidth, targetWidth);
      const height = Math.min(sourceHeight, targetHeight);
      const rowChannels = width * 4;

      for (let y = 0; y < height; y += 1) {
        const sourceOffset = offset(sourceWidth, 0, y);
        const targetOffset = offset(targetWidth, 0, y);

        target.set(bitmap.subarray(sourceOffset, sourceOffset + rowChannels), targetOffset);
      }

      return target;
    };

    export const convertColorSpace = (
      bitmap: Bitmap,
      options: {
        readonly source?: VideoColor.ColorSpace | undefined;
        readonly target: VideoColor.ColorSpace;
      },
    ): Bitmap => {
      const source = options.source ?? VideoColor.DefaultColorSpace;
      const target = options.target;

      if (source === target) return bitmap;

      const converted = new Uint8ClampedArray(bitmap.length);

      for (let index = 0; index < bitmap.length; index += 4) {
        const color = VideoColor.convert(
          VideoColor.byte(
            bitmap[index + 0] ?? 0,
            bitmap[index + 1] ?? 0,
            bitmap[index + 2] ?? 0,
            bitmap[index + 3] ?? 0,
          ),
          source,
          target,
        );

        converted[index + 0] = toByte(color[0]);
        converted[index + 1] = toByte(color[1]);
        converted[index + 2] = toByte(color[2]);
        converted[index + 3] = toByte(color[3]);
      }

      return converted;
    };

    export const fromImageData = (image: ImageData): Bitmap => image.data as Bitmap;

    export const toImageData = (
      bitmap: Bitmap,
      [width, height]: Size,
      colorSpace: VideoColor.ColorSpace,
    ): ImageData => {
      const length = width * height * 4;
      const data = fitChannels(bitmap, length);

      return new ImageData(data as never, width, height, {
        colorSpace,
      });
    };

    export const toByteData = (bitmap: Bitmap, size?: Size): Uint8ClampedArray<ArrayBuffer> => {
      const length = size === undefined ? bitmap.length : area(size) * 4;
      return fitChannels(bitmap, length);
    };

    const area = ([width, height]: Size): number => width * height;

    const offset = (width: number, x: number, y: number): number => (y * width + x) * 4;

    const fitChannels = (bitmap: Bitmap, length: number): Bitmap => {
      if (bitmap.length === length) return bitmap;

      const data = new Uint8ClampedArray(length);
      data.set(bitmap.subarray(0, Math.min(bitmap.length, length)));

      return data;
    };

    interface MutableChannels {
      [index: number]: number;
    }
  }
}
