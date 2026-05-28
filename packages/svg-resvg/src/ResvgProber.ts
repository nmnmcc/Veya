import { Resvg } from "@resvg/resvg-js";
import type { ResvgRenderOptions } from "@resvg/resvg-js";
import { Effect, Layer } from "effect";

import type { Size } from "@veya/core";
import { SvgProber } from "@veya/svg";

export namespace ResvgProber {
  /** Options for the Resvg-backed SVG prober service. */
  export interface Options {
    /** Render options passed to Resvg while reading SVG dimensions. */
    readonly render?: ResvgRenderOptions | undefined;
  }

  /** Creates a Resvg-backed `SvgProber` service implementation. */
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

  /** Layer that provides a Resvg-backed `SvgProber`. */
  export const layer = (options: Options = {}) => Layer.succeed(SvgProber, make(options));
}
