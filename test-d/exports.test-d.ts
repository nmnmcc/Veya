import { expectAssignable } from "tsd";
import * as Core from "@veya/core";
import * as Modifier from "@veya/modifier";
import * as SourceAudio from "@veya/source-audio";
import * as SourceColor from "@veya/source-color";
import * as SourceImage from "@veya/source-image";
import * as SourceSvg from "@veya/source-svg";
import * as SourceSvgResvg from "@veya/source-svg-resvg";
import * as SourceVideo from "@veya/source-video";

expectAssignable<typeof Core.FrameCountSchema>(Core.FrameCountSchema);
expectAssignable<typeof Core.SizeSchema>(Core.SizeSchema);
expectAssignable<typeof Core.PositionSchema>(Core.PositionSchema);
expectAssignable<typeof Core.SampleCountSchema>(Core.SampleCountSchema);
expectAssignable<typeof Core.SamplerateSchema>(Core.SamplerateSchema);
expectAssignable<typeof Core.ChannelCountSchema>(Core.ChannelCountSchema);
expectAssignable<typeof Core.Effectable.resolve>(Core.Effectable.resolve);
expectAssignable<typeof Core.VideoClip.make>(Core.VideoClip.make);
expectAssignable<typeof Core.AudioClip.make>(Core.AudioClip.make);
expectAssignable<typeof Core.CompositeVideoContext>(Core.CompositeVideoContext);
expectAssignable<typeof Core.CompositeAudioContext>(Core.CompositeAudioContext);
expectAssignable<typeof Core.Gap.make>(Core.Gap.make);
expectAssignable<typeof Core.Silence.make>(Core.Silence.make);
expectAssignable<typeof Core.VideoTrack.make>(Core.VideoTrack.make);
expectAssignable<typeof Core.AudioTrack.make>(Core.AudioTrack.make);
expectAssignable<typeof Core.Composite.make>(Core.Composite.make);
expectAssignable<typeof Core.Compositor>(Core.Compositor);
expectAssignable<typeof Core.Encoder>(Core.Encoder);

expectAssignable<typeof Modifier.VideoModifier.make>(Modifier.VideoModifier.make);
expectAssignable<typeof Modifier.VideoModifier.makeStateful>(Modifier.VideoModifier.makeStateful);
expectAssignable<typeof Modifier.VideoModifier.makeStatefulEffect>(Modifier.VideoModifier.makeStatefulEffect);
expectAssignable<typeof Modifier.VideoModifier.apply>(Modifier.VideoModifier.apply);
expectAssignable<typeof Modifier.VideoModifier.applyStateful>(Modifier.VideoModifier.applyStateful);
expectAssignable<typeof Modifier.VideoModifier.chain>(Modifier.VideoModifier.chain);
expectAssignable<typeof Modifier.AudioModifier.make>(Modifier.AudioModifier.make);
expectAssignable<typeof Modifier.AudioModifier.makeStateful>(Modifier.AudioModifier.makeStateful);
expectAssignable<typeof Modifier.AudioModifier.makeStatefulEffect>(Modifier.AudioModifier.makeStatefulEffect);
expectAssignable<typeof Modifier.AudioModifier.apply>(Modifier.AudioModifier.apply);
expectAssignable<typeof Modifier.AudioModifier.applyStateful>(Modifier.AudioModifier.applyStateful);
expectAssignable<typeof Modifier.AudioModifier.chain>(Modifier.AudioModifier.chain);

expectAssignable<typeof SourceVideo.VideoFrame.resolveOffset>(SourceVideo.VideoFrame.resolveOffset);
expectAssignable<typeof SourceVideo.VideoFrame.resolveDuration>(SourceVideo.VideoFrame.resolveDuration);
expectAssignable<typeof SourceVideo.VideoProbe>(SourceVideo.VideoProbe);
expectAssignable<typeof SourceVideo.VideoSource>(SourceVideo.VideoSource);
expectAssignable<typeof SourceVideo.Video.make>(SourceVideo.Video.make);

expectAssignable<typeof SourceAudio.AudioProbe>(SourceAudio.AudioProbe);
expectAssignable<typeof SourceAudio.AudioSource>(SourceAudio.AudioSource);
expectAssignable<typeof SourceAudio.Audio.make>(SourceAudio.Audio.make);

expectAssignable<typeof SourceImage.ImageProbe>(SourceImage.ImageProbe);
expectAssignable<typeof SourceImage.ImageSource>(SourceImage.ImageSource);
expectAssignable<typeof SourceImage.Image.make>(SourceImage.Image.make);

expectAssignable<typeof SourceSvg.SvgProbe>(SourceSvg.SvgProbe);
expectAssignable<typeof SourceSvg.SvgSource>(SourceSvg.SvgSource);
expectAssignable<typeof SourceSvg.Svg.make>(SourceSvg.Svg.make);

expectAssignable<typeof SourceColor.Color.make>(SourceColor.Color.make);

expectAssignable<typeof SourceSvgResvg.ResvgSvg.make>(SourceSvgResvg.ResvgSvg.make);
expectAssignable<typeof SourceSvgResvg.ResvgSvg.sourceLayer>(SourceSvgResvg.ResvgSvg.sourceLayer);
expectAssignable<typeof SourceSvgResvg.ResvgSvg.probeLayer>(SourceSvgResvg.ResvgSvg.probeLayer);
expectAssignable<typeof SourceSvgResvg.ResvgSvg.layer>(SourceSvgResvg.ResvgSvg.layer);
