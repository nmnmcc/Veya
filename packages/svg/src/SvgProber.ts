import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { Size } from "@veya/core";

/** Effect service for reading SVG metadata without rendering pixels. */
export class SvgProber extends Context.Service<SvgProber, SvgProber.SvgProber>()("@veya/svg/SvgProber") {}

export namespace SvgProber {
  /** SVG input as a markup string. */
  export type MediaSource = string;

  /** Error raised when an SVG prober implementation cannot inspect a source. */
  export class Error extends Data.TaggedError("Error")<{
    /** Original error or thrown value, when available. */
    readonly cause?: unknown;
    /** Structured reason for the probe failure. */
    readonly reason: Error.ProbeFailed;
  }> {}
  export namespace Error {
    /** Indicates that metadata probing failed. */
    export class ProbeFailed extends Data.TaggedError("ProbeFailed")<{}> {}
  }

  /** Metadata discovered by an `SvgProber`. */
  export interface Metadata {
    /** SVG viewport size in pixels. */
    readonly size?: Size;
  }

  /** Service contract for custom SVG metadata probers. */
  export interface SvgProber {
    /** Reads metadata from SVG markup. */
    readonly probe: (source: SvgProber.MediaSource) => Effect.Effect<SvgProber.Metadata, Error>;
  }
}
