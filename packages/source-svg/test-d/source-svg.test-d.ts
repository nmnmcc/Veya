import { Effect, Stream } from "effect";
import { expectAssignable, expectError, expectNotAssignable, expectType } from "tsd";
import type { Bitmap, VideoClip } from "@veya/core";
import { Svg, SvgProbe, SvgSource } from "@veya/source-svg";

type EffectSuccess<T> = T extends Effect.Effect<infer A, unknown, unknown> ? A : never;

interface StreamContext {
  readonly streamContext: "stream";
}

declare const bytes: Uint8Array;
declare const byteStream: Stream.Stream<Uint8Array, "stream-error", StreamContext>;

expectAssignable<typeof SvgProbe>(SvgProbe);
expectAssignable<typeof SvgSource>(SvgSource);
expectAssignable<typeof Svg.make>(Svg.make);

expectAssignable<SvgSource.MediaSource>("<svg />");
expectAssignable<SvgSource.MediaSource>(bytes);
expectAssignable<SvgSource.MediaSource<"stream-error", StreamContext>>(byteStream);
expectNotAssignable<SvgSource.MediaSource>(123);

expectAssignable<SvgSource.FitTo>({ mode: "original" });
expectAssignable<SvgSource.FitTo>({ mode: "width", value: 320 });
expectAssignable<SvgSource.FitTo>({ mode: "height", value: 180 });
expectAssignable<SvgSource.FitTo>({ mode: "zoom", value: 2 });
expectError<SvgSource.FitTo>({ mode: "width" });
expectError<SvgSource.FitTo>({ mode: "contain", value: 320 });
expectAssignable<SvgSource.DecodeOptions>({ fitTo: { mode: "width", value: 320 }, background: "#000" });

declare const svgSourceService: SvgSource.Service;
expectAssignable<Effect.Effect<Bitmap, "stream-error" | SvgSource.SvgSourceError, StreamContext>>(
  svgSourceService.decode(byteStream, { fitTo: { mode: "zoom", value: 1 } }),
);

declare const svgProbeService: (typeof SvgProbe)["Service"];
expectAssignable<Effect.Effect<SvgProbe.Metadata, "stream-error" | SvgProbe.SvgProbeError, StreamContext>>(
  svgProbeService.probe(byteStream),
);
expectAssignable<SvgProbe.Metadata>({ size: [320, 180] });

const svgEffect = Svg.make("<svg />", {
  fitTo: { mode: "width", value: 320 },
  background: "#101820",
});
expectAssignable<Effect.Effect<Svg.Svg, never, never>>(svgEffect);
declare const svgClip: EffectSuccess<typeof svgEffect>;
expectAssignable<VideoClip.VideoClip<Svg.SvgSourceError, Svg.Service>>(svgClip);
expectType<typeof SvgSource.SvgSourceError>(Svg.SvgSourceError);
expectError(Svg.make(123));
expectError(Svg.make("<svg />", { fitTo: { mode: "width" } }));
