import { Duration, Effect, Layer, Stream } from "effect";
import { expectAssignable, expectError, expectNotAssignable, expectType } from "tsd";
import type { AudioChunk, AudioClip, Bitmap, CompositeVideoContext, FrameCount, VideoClip } from "@veya/core";
import { Audio, AudioProbe, AudioSource } from "@veya/source-audio";
import { Color } from "@veya/source-color";
import { Image, ImageProbe, ImageSource } from "@veya/source-image";
import { ResvgSvg } from "@veya/source-svg-resvg";
import { Svg, SvgProbe, SvgSource } from "@veya/source-svg";
import { Video, VideoFrame, VideoProbe, VideoSource } from "@veya/source-video";

type EffectSuccess<T> = T extends Effect.Effect<infer A, unknown, unknown> ? A : never;

interface StreamContext {
  readonly streamContext: "stream";
}

interface OptionContext {
  readonly optionContext: "option";
}

declare const bytes: Uint8Array;
declare const byteStream: Stream.Stream<Uint8Array, "stream-error", StreamContext>;
declare const bitmap: Bitmap;
declare const optionSize: Effect.Effect<readonly [width: number, height: number], "option-error", OptionContext>;

expectAssignable<VideoSource.MediaSource>(bytes);
expectAssignable<VideoSource.MediaSource<"stream-error", StreamContext>>(byteStream);
expectNotAssignable<VideoSource.MediaSource>("video.mp4");

expectAssignable<AudioSource.MediaSource>(bytes);
expectAssignable<AudioSource.MediaSource<"stream-error", StreamContext>>(byteStream);
expectNotAssignable<AudioSource.MediaSource>("audio.wav");

expectAssignable<ImageSource.MediaSource>(bytes);
expectAssignable<ImageSource.MediaSource<"stream-error", StreamContext>>(byteStream);
expectNotAssignable<ImageSource.MediaSource>("image.png");

expectAssignable<SvgSource.MediaSource>("<svg />");
expectAssignable<SvgSource.MediaSource>(bytes);
expectAssignable<SvgSource.MediaSource<"stream-error", StreamContext>>(byteStream);
expectNotAssignable<SvgSource.MediaSource>(123);

expectAssignable<VideoSource.DecodeOptions>({
  size: [1920, 1080],
  framerate: 24,
  offset: 12,
  frames: 48,
  playback: "loop",
  speed: 1.25,
});
expectError<VideoSource.DecodeOptions>({ playback: "repeat" });
expectError<VideoSource.DecodeOptions>({ frames: "48" });

expectAssignable<AudioSource.DecodeOptions>({
  samplerate: 48000,
  channels: 2,
  offset: 1024,
  samples: 2048,
  speed: 0.75,
});
expectError<AudioSource.DecodeOptions>({ channels: "stereo" });

expectAssignable<ImageSource.DecodeOptions>({ size: [320, 180] });
expectError<ImageSource.DecodeOptions>({ size: [320] });

expectAssignable<SvgSource.FitTo>({ mode: "original" });
expectAssignable<SvgSource.FitTo>({ mode: "width", value: 320 });
expectAssignable<SvgSource.FitTo>({ mode: "height", value: 180 });
expectAssignable<SvgSource.FitTo>({ mode: "zoom", value: 2 });
expectError<SvgSource.FitTo>({ mode: "width" });
expectError<SvgSource.FitTo>({ mode: "contain", value: 320 });
expectAssignable<SvgSource.DecodeOptions>({ fitTo: { mode: "width", value: 320 }, background: "#000" });

declare const videoSourceService: VideoSource.Service;
expectAssignable<Stream.Stream<Bitmap, "stream-error" | VideoSource.VideoSourceError, StreamContext>>(
  videoSourceService.decode(byteStream, { frames: 12 }),
);

declare const audioSourceService: AudioSource.Service;
expectAssignable<Stream.Stream<AudioChunk, "stream-error" | AudioSource.AudioSourceError, StreamContext>>(
  audioSourceService.decode(byteStream, { samples: 1024 }),
);

declare const imageSourceService: ImageSource.Service;
expectAssignable<Effect.Effect<Bitmap, "stream-error" | ImageSource.ImageSourceError, StreamContext>>(
  imageSourceService.decode(byteStream, { size: [320, 180] }),
);

declare const svgSourceService: SvgSource.Service;
expectAssignable<Effect.Effect<Bitmap, "stream-error" | SvgSource.SvgSourceError, StreamContext>>(
  svgSourceService.decode(byteStream, { fitTo: { mode: "zoom", value: 1 } }),
);

declare const videoProbeService: (typeof VideoProbe)["Service"];
expectAssignable<Effect.Effect<VideoProbe.Metadata, "stream-error" | VideoProbe.VideoProbeError, StreamContext>>(
  videoProbeService.probe(byteStream),
);
expectAssignable<VideoProbe.Metadata>({
  size: [1920, 1080],
  framerate: 24,
  frames: 96,
  duration: Duration.seconds(4),
});

declare const audioProbeService: (typeof AudioProbe)["Service"];
expectAssignable<Effect.Effect<AudioProbe.Metadata, "stream-error" | AudioProbe.AudioProbeError, StreamContext>>(
  audioProbeService.probe(byteStream),
);
expectAssignable<AudioProbe.Metadata>({
  samplerate: 48000,
  channels: 2,
  samples: 48000,
  duration: Duration.seconds(1),
});

declare const imageProbeService: (typeof ImageProbe)["Service"];
expectAssignable<Effect.Effect<ImageProbe.Metadata, "stream-error" | ImageProbe.ImageProbeError, StreamContext>>(
  imageProbeService.probe(byteStream),
);
expectAssignable<ImageProbe.Metadata>({ size: [320, 180] });

declare const svgProbeService: (typeof SvgProbe)["Service"];
expectAssignable<Effect.Effect<SvgProbe.Metadata, "stream-error" | SvgProbe.SvgProbeError, StreamContext>>(
  svgProbeService.probe(byteStream),
);
expectAssignable<SvgProbe.Metadata>({ size: [320, 180] });

const videoEffect = Video.make(byteStream, {
  size: [320, 180],
  framerate: 24,
  offset: VideoFrame.millis(500),
  duration: VideoFrame.seconds(1),
  playback: "freeze",
  speed: 1.25,
});
expectAssignable<Effect.Effect<Video.Video<"stream-error", StreamContext>, never, never>>(videoEffect);
declare const videoClip: EffectSuccess<typeof videoEffect>;
expectAssignable<
  VideoClip.VideoClip<
    "stream-error" | Video.VideoSourceError | VideoProbe.VideoProbeError | VideoFrame.VideoFrameError,
    StreamContext | Video.Service | VideoProbe
  >
>(videoClip);
expectType<typeof VideoSource.VideoSourceError>(Video.VideoSourceError);
expectError(Video.make("video.mp4"));
expectError(Video.make(bytes, { playback: "repeat" }));

const audioEffect = Audio.make(byteStream, {
  samplerate: 48000,
  channels: 2,
  offset: 1024,
  duration: 2048,
  speed: 0.75,
});
expectAssignable<Effect.Effect<Audio.Audio<"stream-error", StreamContext>, never, never>>(audioEffect);
declare const audioClip: EffectSuccess<typeof audioEffect>;
expectAssignable<AudioClip.AudioClip<"stream-error" | Audio.AudioSourceError, StreamContext | Audio.Service>>(
  audioClip,
);
expectType<typeof AudioSource.AudioSourceError>(Audio.AudioSourceError);
expectError(Audio.make("audio.wav"));
expectError(Audio.make(bytes, { channels: "stereo" }));

const imageEffect = Image.make(byteStream, { size: optionSize });
expectAssignable<
  Effect.Effect<
    Image.Image<"stream-error", StreamContext, "option-error", OptionContext>,
    "option-error",
    OptionContext
  >
>(imageEffect);
declare const imageClip: EffectSuccess<typeof imageEffect>;
expectAssignable<
  VideoClip.VideoClip<
    "stream-error" | Image.ImageSourceError | "option-error",
    StreamContext | Image.Service | OptionContext
  >
>(imageClip);
expectType<typeof ImageSource.ImageSourceError>(Image.ImageSourceError);
expectError(Image.make("image.png"));
expectError(Image.make(bytes, { size: [320] }));

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

const colorEffect = Color.make([24, 32, 44, 255], 6, { size: [320, 180] });
expectAssignable<Effect.Effect<Color.Color, never, never>>(colorEffect);
declare const colorClip: EffectSuccess<typeof colorEffect>;
expectAssignable<VideoClip.VideoClip<never, CompositeVideoContext>>(colorClip);
expectError(Color.make([24, 32, 44], 6));
expectError(Color.make([24, 32, 44, 255], "six"));

expectAssignable<VideoFrame.TimeInput>(VideoFrame.seconds(1));
expectAssignable<VideoFrame.TimeInput>(VideoFrame.millis(250));
expectAssignable<VideoFrame.Input>(24);
expectAssignable<VideoFrame.Input>(VideoFrame.seconds(1));
expectType<boolean>(VideoFrame.requiresFramerate(VideoFrame.seconds(1)));
expectAssignable<Effect.Effect<VideoFrame.Index, VideoProbe.VideoProbeError | VideoFrame.VideoFrameError, VideoProbe>>(
  VideoFrame.resolveOffset(24, {}),
);
expectAssignable<Effect.Effect<FrameCount, VideoProbe.VideoProbeError | VideoFrame.VideoFrameError, VideoProbe>>(
  VideoFrame.resolveDuration(24, {}),
);
expectError(VideoFrame.resolveOffset(24, { rounding: "nearest" }));

const resvg = ResvgSvg.make();
expectAssignable<SvgSource.Service>(resvg);
expectAssignable<(typeof SvgProbe)["Service"]>(resvg);
expectAssignable<Layer.Layer<SvgSource>>(ResvgSvg.sourceLayer());
expectAssignable<Layer.Layer<SvgProbe>>(ResvgSvg.probeLayer());
expectAssignable<Layer.Layer<SvgSource | SvgProbe>>(ResvgSvg.layer());
expectAssignable<ResvgSvg.Options>({});
