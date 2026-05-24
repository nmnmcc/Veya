import { Context, Data } from "effect";
import type { Effect, Stream } from "effect";
import type { Size } from "@veya/core";

export class SvgProbe extends Context.Service<
  SvgProbe,
  {
    readonly probe: <SourceE = never, SourceR = never>(
      source: SvgProbe.MediaSource<SourceE, SourceR>,
    ) => Effect.Effect<SvgProbe.Metadata, SourceE | SvgProbe.SvgProbeError, SourceR>;
  }
>()("@veya/source-svg/SvgProbe") {}

export namespace SvgProbe {
  export type MediaSource<E = never, R = never> = string | Uint8Array | Stream.Stream<Uint8Array, E, R>;

  export class SvgProbeError extends Data.TaggedError("SvgProbeError")<{
    readonly reason?: unknown;
  }> {}

  export interface Metadata {
    readonly size?: Size;
  }
}
