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

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.DecodeFailed | Error.InvalidPixelBuffer;
  }> {}
  export namespace Error {
    export class DecodeFailed extends Data.TaggedError("DecodeFailed")<{}> {}
    export class InvalidPixelBuffer extends Data.TaggedError("InvalidPixelBuffer")<{
      readonly actualBytes: number;
      readonly expectedBytes: number;
    }> {}
  }

  export interface DecodeOptions {
    readonly size?: Size | undefined;
    readonly fitTo?: FitTo | undefined;
    readonly background?: string | undefined;
  }

  export interface SvgDecoder {
    readonly decode: (source: MediaSource, options: DecodeOptions) => Effect.Effect<VideoClip.Bitmap, Error>;
  }
}
