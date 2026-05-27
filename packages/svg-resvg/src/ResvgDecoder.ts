import { Resvg } from "@resvg/resvg-js";
import type { ResvgRenderOptions } from "@resvg/resvg-js";
import { Effect, Layer } from "effect";

import type { Size, VideoClip } from "@veya/core";
import { SvgDecoder } from "@veya/svg";

export namespace ResvgDecoder {
  export interface Options {
    readonly render?: ResvgRenderOptions;
  }

  export const make = (options: Options = {}): SvgDecoder.SvgDecoder => ({
    decode: (source, decodeOptions) => {
      const renderOptions = makeRenderOptions(options.render, decodeOptions);

      return Effect.try({
        try: () => {
          const resvg = new Resvg(source, renderOptions);
          const rendered = resvg.render();
          const size = [rendered.width, rendered.height] as const;

          return pixelsToBitmap(rendered.pixels, size);
        },
        catch: (reason) => new SvgDecoder.SvgDecoderError({ reason }),
      });
    },
  });

  export const layer = (options: Options = {}) => Layer.succeed(SvgDecoder, make(options));

  const makeRenderOptions = (
    defaults: ResvgRenderOptions | undefined,
    options: SvgDecoder.DecodeOptions,
  ): ResvgRenderOptions => {
    const { size, ...renderOptions } = options;

    return {
      ...defaults,
      ...(size ? { fitTo: { mode: "width" as const, value: size[0] } } : {}),
      ...renderOptions,
    };
  };

  const pixelsToBitmap = (pixels: Uint8Array, [width, height]: Size): VideoClip.Bitmap => {
    const expectedBytes = width * height * 4;
    if (pixels.length < expectedBytes) {
      throw new Error(`resvg returned ${pixels.length} RGBA bytes for a ${width}x${height} image`);
    }

    let offset = 0;

    return globalThis.Array.from({ length: height }, () =>
      globalThis.Array.from({ length: width }, () => {
        const pixel = [
          pixels[offset] ?? 0,
          pixels[offset + 1] ?? 0,
          pixels[offset + 2] ?? 0,
          pixels[offset + 3] ?? 0,
        ] as const;
        offset += 4;

        return pixel;
      }),
    );
  };
}
