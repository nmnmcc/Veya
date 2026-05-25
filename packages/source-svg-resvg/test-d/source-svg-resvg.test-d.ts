import { Layer } from "effect";
import { expectAssignable } from "tsd";
import { SvgProbe, SvgSource } from "@veya/source-svg";
import { ResvgSvg } from "@veya/source-svg-resvg";

expectAssignable<typeof ResvgSvg.make>(ResvgSvg.make);
expectAssignable<typeof ResvgSvg.sourceLayer>(ResvgSvg.sourceLayer);
expectAssignable<typeof ResvgSvg.probeLayer>(ResvgSvg.probeLayer);
expectAssignable<typeof ResvgSvg.layer>(ResvgSvg.layer);

const resvg = ResvgSvg.make();
expectAssignable<SvgSource.Service>(resvg);
expectAssignable<(typeof SvgProbe)["Service"]>(resvg);
expectAssignable<Layer.Layer<SvgSource>>(ResvgSvg.sourceLayer());
expectAssignable<Layer.Layer<SvgProbe>>(ResvgSvg.probeLayer());
expectAssignable<Layer.Layer<SvgSource | SvgProbe>>(ResvgSvg.layer());
expectAssignable<ResvgSvg.Options>({});
