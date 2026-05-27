import { VideoFilter } from "./VideoFilter";

export namespace VideoConvolutionFilter {
  export interface ConvolveOptions {
    readonly factor?: number;
    readonly bias?: number;
    readonly preserveAlpha?: boolean;
  }

  export const blur = (radius = 1): VideoFilter.Filter => {
    const normalizedRadius = Math.max(0, Math.round(VideoFilter.finiteOr(radius, 1)));

    if (normalizedRadius === 0) {
      return VideoFilter.identity();
    }

    const size = normalizedRadius * 2 + 1;
    const kernel = globalThis.Array.from({ length: size }, () => globalThis.Array.from({ length: size }, () => 1));

    return convolve(kernel, {
      factor: 1 / (size * size),
      preserveAlpha: false,
    });
  };

  export const sharpen = (amount = 1): VideoFilter.Filter => {
    const intensity = Math.max(0, VideoFilter.finiteOr(amount, 1));

    if (intensity === 0) {
      return VideoFilter.identity();
    }

    return convolve(
      [
        [0, -intensity, 0],
        [-intensity, 1 + 4 * intensity, -intensity],
        [0, -intensity, 0],
      ],
      { preserveAlpha: true },
    );
  };

  export const emboss = (amount = 1): VideoFilter.Filter => {
    const intensity = Math.max(0, VideoFilter.finiteOr(amount, 1));

    if (intensity === 0) {
      return VideoFilter.identity();
    }

    return convolve(
      [
        [-2 * intensity, -intensity, 0],
        [-intensity, 1, intensity],
        [0, intensity, 2 * intensity],
      ],
      { bias: 128, preserveAlpha: true },
    );
  };

  export const edgeDetect = (amount = 1): VideoFilter.Filter => {
    const intensity = Math.max(0, VideoFilter.finiteOr(amount, 1));

    if (intensity === 0) {
      return VideoFilter.identity();
    }

    return convolve(
      [
        [-intensity, -intensity, -intensity],
        [-intensity, 8 * intensity, -intensity],
        [-intensity, -intensity, -intensity],
      ],
      { preserveAlpha: true },
    );
  };

  export const convolve = (
    kernel: readonly (readonly number[])[],
    options: ConvolveOptions = {},
  ): VideoFilter.Filter => {
    const normalizedKernel = normalizeKernel(kernel);
    const kernelHeight = normalizedKernel.length;
    const kernelWidth = normalizedKernel[0]?.length ?? 1;
    const offsetX = Math.floor(kernelWidth / 2);
    const offsetY = Math.floor(kernelHeight / 2);
    const factor = options.factor ?? getKernelFactor(normalizedKernel);
    const bias = options.bias ?? 0;
    const preserveAlpha = options.preserveAlpha ?? true;

    return (bitmap) =>
      VideoFilter.mapPixels((pixel, { x, y }) => {
        let red = 0;
        let green = 0;
        let blue = 0;
        let alpha = 0;

        for (let kernelY = 0; kernelY < kernelHeight; kernelY += 1) {
          const row = normalizedKernel[kernelY] ?? [];

          for (let kernelX = 0; kernelX < kernelWidth; kernelX += 1) {
            const weight = row[kernelX] ?? 0;
            const sample = VideoFilter.readPixel(bitmap, x + kernelX - offsetX, y + kernelY - offsetY);

            red += sample[0] * weight;
            green += sample[1] * weight;
            blue += sample[2] * weight;
            alpha += sample[3] * weight;
          }
        }

        return VideoFilter.rgba(
          red * factor + bias,
          green * factor + bias,
          blue * factor + bias,
          preserveAlpha ? pixel[3] : alpha * factor + bias,
        );
      })(bitmap);
  };
}

const normalizeKernel = (kernel: readonly (readonly number[])[]): readonly (readonly number[])[] => {
  if (kernel.length === 0) {
    return [[1]];
  }

  const width = Math.max(1, ...kernel.map((row) => row.length));

  return globalThis.Array.from({ length: kernel.length }, (_, y) => {
    const row = kernel[y] ?? [];

    return globalThis.Array.from({ length: width }, (_, x) => VideoFilter.finiteOr(row[x] ?? 0, 0));
  });
};

const getKernelFactor = (kernel: readonly (readonly number[])[]): number => {
  const sum = kernel.reduce((total, row) => total + row.reduce((rowTotal, value) => rowTotal + value, 0), 0);

  return sum === 0 ? 1 : 1 / sum;
};
