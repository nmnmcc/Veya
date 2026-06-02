import { Resvg } from "@resvg/resvg-js";
import type { ResvgRenderOptions } from "@resvg/resvg-js";
import { Effect, Layer } from "effect";

import { SvgDecoder } from "@veya/svg";

export namespace ResvgDecoder {
  export interface Options {
    /** Default render options passed to Resvg before per-decode options are applied. */
    readonly render?: ResvgRenderOptions | undefined;
  }

  export const make = (defaults: Options = {}): SvgDecoder.SvgDecoder => ({
    decode: (source, options) => {
      return Effect.gen(function* () {
        const { width, height, pixels } = yield* Effect.try({
          try: () =>
            new Resvg(source, {
              ...defaults,
              ...(options.size ? { fitTo: { mode: "width" as const, value: options.size[0] } } : {}),
              ...(options.fitTo === undefined ? {} : { fitTo: options.fitTo }),
              ...(options.background === undefined ? {} : { background: options.background }),
            }).render(),
          catch: (cause) =>
            new SvgDecoder.Error({
              cause,
              reason: new SvgDecoder.Error.DecodeFailed(),
            }),
        });
        const expectedBytes = width * height * 4;
        if (pixels.length < expectedBytes) {
          return yield* new SvgDecoder.Error({
            reason: new SvgDecoder.Error.InvalidPixelBuffer({
              actualBytes: pixels.length,
              expectedBytes,
            }),
          });
        }

        const bitmap = new Uint8ClampedArray(expectedBytes);
        bitmap.set(pixels.subarray(0, expectedBytes));

        return bitmap;
      });
    },
  });

  export const layer = (options: Options = {}) => Layer.succeed(SvgDecoder, make(options));
}
