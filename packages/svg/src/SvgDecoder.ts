import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { VideoClip } from "@veya/core";
import type { Size } from "@veya/core";

export class SvgDecoder extends Context.Service<SvgDecoder, SvgDecoder.SvgDecoder>()("@veya/svg/SvgDecoder") {}

export namespace SvgDecoder {
  export type MediaSource = string;

  export type FitTo =
    | { readonly mode: "original" }
    | { readonly mode: "width"; readonly value: number }
    | { readonly mode: "height"; readonly value: number }
    | { readonly mode: "zoom"; readonly value: number };

  export class SvgDecoderError extends Data.TaggedError("SvgDecoderError")<{
    readonly reason?: unknown;
  }> {}

  export interface DecodeOptions {
    readonly size?: Size;
    readonly fitTo?: FitTo;
    readonly background?: string;
  }

  export interface SvgDecoder {
    readonly decode: (source: MediaSource, options: DecodeOptions) => Effect.Effect<VideoClip.Bitmap, SvgDecoderError>;
  }
}
