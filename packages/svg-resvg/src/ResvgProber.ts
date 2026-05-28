import { Resvg } from "@resvg/resvg-js";
import type { ResvgRenderOptions } from "@resvg/resvg-js";
import { Effect, Layer } from "effect";

import type { Size } from "@veya/core";
import { SvgProber } from "@veya/svg";

export namespace ResvgProber {
  export interface Options {
    readonly render?: ResvgRenderOptions | undefined;
  }

  export const make = (options: Options = {}): SvgProber.SvgProber => ({
    probe: (source) =>
      Effect.try({
        try: () => {
          const resvg = new Resvg(source, options.render);
          const size: Size = [resvg.width, resvg.height];

          return { size };
        },
        catch: (cause) =>
          new SvgProber.Error({
            cause,
            reason: new SvgProber.Error.ProbeFailed(),
          }),
      }),
  });

  export const layer = (options: Options = {}) => Layer.succeed(SvgProber, make(options));
}
