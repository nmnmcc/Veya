import { Resvg } from "@resvg/resvg-js";
import type { ResvgRenderOptions } from "@resvg/resvg-js";
import { Effect, Layer } from "effect";

import type { Size, VideoClip } from "@veya/core";
import { SvgDecoder } from "@veya/svg";

export namespace ResvgDecoder {
  export interface Options {
    readonly render?: ResvgRenderOptions | undefined;
  }

  export const make = (options: Options = {}): SvgDecoder.SvgDecoder => ({
    decode: (source, decodeOptions) => {
      const renderOptions = makeRenderOptions(options.render, decodeOptions);

      return Effect.gen(function* () {
        const rendered = yield* Effect.try({
          try: () => {
            const resvg = new Resvg(source, renderOptions);

            return resvg.render();
          },
          catch: (cause) =>
            new SvgDecoder.Error({
              cause,
              reason: new SvgDecoder.Error.DecodeFailed(),
            }),
        });
        const size = [rendered.width, rendered.height] as const;

        return yield* pixelsToBitmap(rendered.pixels, size);
      });
    },
  });

  export const layer = (options: Options = {}) => Layer.succeed(SvgDecoder, make(options));

  const makeRenderOptions = (
    defaults: ResvgRenderOptions | undefined,
    options: SvgDecoder.DecodeOptions,
  ): ResvgRenderOptions => {
    const { background, fitTo, size } = options;

    return {
      ...defaults,
      ...(size ? { fitTo: { mode: "width" as const, value: size[0] } } : {}),
      ...(fitTo === undefined ? {} : { fitTo }),
      ...(background === undefined ? {} : { background }),
    };
  };

  const pixelsToBitmap = (
    pixels: Uint8Array,
    [width, height]: Size,
  ): Effect.Effect<VideoClip.Bitmap, SvgDecoder.Error> =>
    Effect.gen(function* () {
      const expectedBytes = width * height * 4;
      if (pixels.length < expectedBytes) {
        return yield* new SvgDecoder.Error({
          reason: new SvgDecoder.Error.InvalidPixelBuffer({
            actualBytes: pixels.length,
            expectedBytes,
          }),
        });
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
    });
}
