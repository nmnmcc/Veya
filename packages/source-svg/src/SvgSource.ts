import { Context, Data } from "effect";
import type { Effect } from "effect";
import type { Bitmap } from "@veya/core";
import { SvgProbe } from "./SvgProbe";

export class SvgSource extends Context.Service<SvgSource, SvgSource.Service>()("@veya/source-svg/SvgSource") {}

export namespace SvgSource {
  export type MediaSource<E = never, R = never> = SvgProbe.MediaSource<E, R>;

  export type FitTo =
    | { readonly mode: "original" }
    | { readonly mode: "width"; readonly value: number }
    | { readonly mode: "height"; readonly value: number }
    | { readonly mode: "zoom"; readonly value: number };

  export class SvgSourceError extends Data.TaggedError("SvgSourceError")<{
    readonly reason?: unknown;
  }> {}

  export interface DecodeOptions {
    readonly fitTo?: FitTo;
    readonly background?: string;
  }

  export interface Service {
    readonly decode: <SourceE = never, SourceR = never>(
      source: MediaSource<SourceE, SourceR>,
      options: DecodeOptions,
    ) => Effect.Effect<Bitmap, SourceE | SvgSourceError, SourceR>;
  }
}
