import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { Size } from "@veya/core";

export class SvgProber extends Context.Service<SvgProber, SvgProber.SvgProber>()("@veya/svg/SvgProber") {}

export namespace SvgProber {
  export interface SvgProber {
    readonly probe: (source: SvgProber.MediaSource) => Effect.Effect<SvgProber.Metadata, Error>;
  }

  /** SVG input as a markup string. */
  export type MediaSource = string;

  export class Error extends Data.TaggedError("Error")<{
    readonly cause?: unknown;
    readonly reason: Error.ProbeFailed;
  }> {}
  export namespace Error {
    export class ProbeFailed extends Data.TaggedError("ProbeFailed")<{}> {}
  }

  export interface Metadata {
    /** SVG viewport size in pixels. */
    readonly size?: Size;
  }
}
