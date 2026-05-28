import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { VideoClip } from "@veya/core";
import type { Size } from "@veya/core";

/** Effect service for rendering SVG markup into a bitmap frame. */
export class SvgDecoder extends Context.Service<SvgDecoder, SvgDecoder.SvgDecoder>()("@veya/svg/SvgDecoder") {}

export namespace SvgDecoder {
  /** SVG input as a markup string. */
  export type MediaSource = string;

  /** Size fitting options supported by SVG renderer implementations. */
  export type FitTo =
    | { readonly mode: "original" }
    | { readonly mode: "width"; readonly value: number }
    | { readonly mode: "height"; readonly value: number }
    | { readonly mode: "zoom"; readonly value: number };

  /** Error raised when an SVG decoder implementation cannot render a source. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the decode failure. */
    readonly reason: Error.DecodeFailed | Error.InvalidPixelBuffer;
  }> {}
  export namespace Error {
    /** Indicates that SVG rendering failed. */
    export class DecodeFailed extends Data.TaggedError("DecodeFailed")<{}> {}
    /** Indicates that a renderer returned fewer pixel bytes than expected. */
    export class InvalidPixelBuffer extends Data.TaggedError("InvalidPixelBuffer")<{
      /** Number of bytes returned by the renderer. */
      readonly actualBytes: number;
      /** Number of bytes required by the rendered frame size. */
      readonly expectedBytes: number;
    }> {}
  }

  /** Resolved options passed to an SVG decoder implementation. */
  export interface DecodeOptions {
    /** Output frame size in pixels. */
    readonly size?: Size | undefined;
    /** Renderer-specific fit mode. */
    readonly fitTo?: FitTo | undefined;
    /** Background color applied behind the SVG. */
    readonly background?: string | undefined;
  }

  /** Service contract for custom SVG decoder implementations. */
  export interface SvgDecoder {
    /** Renders SVG markup into a bitmap frame. */
    readonly decode: (source: MediaSource, options: DecodeOptions) => Effect.Effect<VideoClip.Bitmap, Error>;
  }
}
