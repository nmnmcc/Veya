import { Context, Data } from "effect";
import type { Effect } from "effect";

import type { Size } from "@veya/core";

export class SvgProber extends Context.Service<SvgProber, SvgProber.SvgProber>()("@veya/svg/SvgProber") {}

export namespace SvgProber {
  export type MediaSource = string;

  export class SvgProberError extends Data.TaggedError("SvgProberError")<{
    readonly reason?: unknown;
  }> {}

  export interface Metadata {
    readonly size?: Size;
  }

  export interface SvgProber {
    readonly probe: (source: SvgProber.MediaSource) => Effect.Effect<SvgProber.Metadata, SvgProber.SvgProberError>;
  }
}
