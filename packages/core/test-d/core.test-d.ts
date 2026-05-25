import { Effect, Stream } from "effect";
import { expectAssignable, expectError, expectNotAssignable, expectType } from "tsd";
import {
  AudioClip,
  AudioTrack,
  ChannelCountSchema,
  Composite,
  CompositeAudioContext,
  CompositeVideoContext,
  Compositor,
  Effectable,
  Encoder,
  FrameCountSchema,
  Gap,
  PositionSchema,
  SampleCountSchema,
  SamplerateSchema,
  Silence,
  SizeSchema,
  VideoClip,
  VideoTrack,
} from "@veya/core";
import type {
  AudioBuffer,
  AudioChunk,
  Bitmap,
  ChannelCount,
  FrameCount,
  Position,
  RGBA,
  SampleCount,
  Samplerate,
  Size,
} from "@veya/core";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? (<T>() => T extends B ? 1 : 2) extends <T>() => T extends A ? 1 : 2
      ? true
      : false
    : false;

type StreamError<T> = T extends Stream.Stream<unknown, infer E, unknown> ? E : never;
type StreamContext<T> = T extends Stream.Stream<unknown, unknown, infer R> ? R : never;

interface InputContext {
  readonly inputContext: "input";
}

interface ClipContext {
  readonly clipContext: "clip";
}

interface SecondClipContext {
  readonly secondClipContext: "second-clip";
}

interface VideoRuntime {
  readonly videoRuntime: "video";
}

interface AudioRuntime {
  readonly audioRuntime: "audio";
}

interface DurationContext {
  readonly durationContext: "duration";
}

interface FileContext {
  readonly fileContext: "file";
}

expectAssignable<typeof FrameCountSchema>(FrameCountSchema);
expectAssignable<typeof SizeSchema>(SizeSchema);
expectAssignable<typeof PositionSchema>(PositionSchema);
expectAssignable<typeof SampleCountSchema>(SampleCountSchema);
expectAssignable<typeof SamplerateSchema>(SamplerateSchema);
expectAssignable<typeof ChannelCountSchema>(ChannelCountSchema);
expectAssignable<typeof Effectable.resolve>(Effectable.resolve);
expectAssignable<typeof VideoClip.make>(VideoClip.make);
expectAssignable<typeof AudioClip.make>(AudioClip.make);
expectAssignable<typeof CompositeVideoContext>(CompositeVideoContext);
expectAssignable<typeof CompositeAudioContext>(CompositeAudioContext);
expectAssignable<typeof Gap.make>(Gap.make);
expectAssignable<typeof Silence.make>(Silence.make);
expectAssignable<typeof VideoTrack.make>(VideoTrack.make);
expectAssignable<typeof AudioTrack.make>(AudioTrack.make);
expectAssignable<typeof Composite.make>(Composite.make);
expectAssignable<typeof Compositor>(Compositor);
expectAssignable<typeof Encoder>(Encoder);

expectAssignable<FrameCount>(1);
expectAssignable<SampleCount>(1024);
expectAssignable<Samplerate>(48000);
expectAssignable<ChannelCount>(2);
expectAssignable<Size>([1920, 1080]);
expectAssignable<Position>([0, 0]);
expectAssignable<RGBA>([255, 128, 0, 255]);
expectAssignable<Bitmap>([[[255, 128, 0, 255]]]);
expectAssignable<AudioBuffer>({ samplerate: 48000, channels: [new Float32Array(256)] });
expectAssignable<AudioChunk>({ samplerate: 48000, channels: [new Float32Array(256)] });

expectNotAssignable<Size>([1920]);
expectNotAssignable<Position>([0, 0, 0]);
expectNotAssignable<RGBA>([255, 128, 0]);
expectError<AudioBuffer>({ samplerate: 48000 });

declare const effectableInput: Effect.Effect<"ready", "input-error", InputContext>;
expectType<Effect.Effect<"ready", never, never>>(Effectable.resolve("ready" as const));
expectType<Effect.Effect<"ready", "input-error", InputContext>>(Effectable.resolve(effectableInput));
expectAssignable<Effectable<"ready", "input-error", InputContext>>(effectableInput);
expectAssignable<Effectable<"ready">>("ready");

declare const videoRender: Stream.Stream<Bitmap, "clip-error", ClipContext>;
declare const audioRender: Stream.Stream<AudioChunk, "clip-error", ClipContext>;
declare const rawVideoClip: VideoClip.VideoClip<"clip-error", ClipContext>;
declare const secondVideoClip: VideoClip.VideoClip<"second-clip-error", SecondClipContext>;
declare const rawAudioClip: AudioClip.AudioClip<"clip-error", ClipContext>;
declare const secondAudioClip: AudioClip.AudioClip<"second-clip-error", SecondClipContext>;
declare const deferredVideoClip: Effect.Effect<typeof rawVideoClip, "input-error", InputContext>;
declare const deferredAudioClip: Effect.Effect<typeof rawAudioClip, "input-error", InputContext>;

expectAssignable<VideoClip.Render<"clip-error", ClipContext>>(videoRender);
expectAssignable<AudioClip.Render<"clip-error", ClipContext>>(audioRender);
expectNotAssignable<AudioClip.AudioClip>(rawVideoClip);
expectNotAssignable<VideoClip.VideoClip>(rawAudioClip);

const madeVideoClip = VideoClip.make(deferredVideoClip);
expectAssignable<VideoClip.VideoClip<"clip-error" | "input-error", ClipContext | InputContext>>(madeVideoClip);
expectType<true>(true as Equal<StreamError<typeof madeVideoClip.render>, "clip-error" | "input-error">);
expectType<true>(true as Equal<StreamContext<typeof madeVideoClip.render>, ClipContext | InputContext>);

const madeAudioClip = AudioClip.make(deferredAudioClip);
expectAssignable<AudioClip.AudioClip<"clip-error" | "input-error", ClipContext | InputContext>>(madeAudioClip);
expectType<true>(true as Equal<StreamError<typeof madeAudioClip.render>, "clip-error" | "input-error">);
expectType<true>(true as Equal<StreamContext<typeof madeAudioClip.render>, ClipContext | InputContext>);

declare const videoClips: readonly VideoClip.VideoClip<
  "clip-error" | "second-clip-error",
  ClipContext | SecondClipContext
>[];
const videoTrack = VideoTrack.make<
  readonly VideoClip.VideoClip<"clip-error" | "second-clip-error", ClipContext | SecondClipContext>[],
  "clip-error" | "second-clip-error",
  ClipContext | SecondClipContext
>(videoClips);
expectAssignable<VideoTrack.VideoTrack<"clip-error" | "second-clip-error", ClipContext | SecondClipContext>>(
  videoTrack,
);

declare const audioClips: readonly AudioClip.AudioClip<
  "clip-error" | "second-clip-error",
  ClipContext | SecondClipContext
>[];
const audioTrack = AudioTrack.make<
  readonly AudioClip.AudioClip<"clip-error" | "second-clip-error", ClipContext | SecondClipContext>[],
  "clip-error" | "second-clip-error",
  ClipContext | SecondClipContext
>(audioClips);
expectAssignable<AudioTrack.AudioTrack<"clip-error" | "second-clip-error", ClipContext | SecondClipContext>>(
  audioTrack,
);

declare const deferredFrames: Effect.Effect<FrameCount, "duration-error", DurationContext>;
declare const deferredSamples: Effect.Effect<SampleCount, "duration-error", DurationContext>;

const gap = Gap.make(deferredFrames);
expectAssignable<VideoClip.VideoClip<"duration-error", DurationContext | CompositeVideoContext>>(gap);

const silence = Silence.make(deferredSamples);
expectAssignable<AudioClip.AudioClip<"duration-error", DurationContext | CompositeAudioContext>>(silence);

expectAssignable<CompositeVideoContext.CompositeVideoContext>({ size: [16, 9], framerate: 24 });
expectAssignable<CompositeAudioContext.CompositeAudioContext>({ samplerate: 48000, channels: 2 });
expectError<CompositeVideoContext.CompositeVideoContext>({ size: [16, 9] });
expectError<CompositeAudioContext.CompositeAudioContext>({ samplerate: 48000 });

declare const compositeVideoTrack: VideoTrack.VideoTrack<"video-track-error", VideoRuntime | CompositeVideoContext>;
declare const compositeAudioTrack: AudioTrack.AudioTrack<"audio-track-error", AudioRuntime | CompositeAudioContext>;

const composite = Composite.make({
  video: {
    size: [16, 9],
    framerate: 24,
    tracks: [compositeVideoTrack] as const,
  },
  audio: {
    samplerate: 48000,
    channels: 2,
    tracks: [compositeAudioTrack] as const,
  },
});

expectAssignable<
  Composite.Composite<
    "video-track-error" | Compositor.CompositorError,
    VideoRuntime | Compositor,
    "audio-track-error" | Compositor.CompositorError,
    AudioRuntime | Compositor
  >
>(composite);
expectType<true>(true as Equal<StreamContext<typeof composite.video.render>, VideoRuntime | Compositor>);
expectType<true>(true as Equal<StreamContext<typeof composite.audio.render>, AudioRuntime | Compositor>);

expectAssignable<Compositor.VideoCompositeOptions>({ size: [16, 9] });
expectAssignable<Compositor.AudioMixOptions>({ samplerate: 48000, channels: 2 });
expectError<Compositor.VideoCompositeOptions>({ framerate: 24 });
expectError<Compositor.AudioMixOptions>({ samplerate: 48000 });

declare const compositorService: Compositor.Compositor;
expectAssignable<Effect.Effect<Bitmap, Compositor.CompositorError>>(
  compositorService.compositeVideo([], { size: [16, 9] }),
);
expectAssignable<Effect.Effect<AudioBuffer, Compositor.CompositorError>>(
  compositorService.mixAudio([], { samplerate: 48000, channels: 2 }),
);

expectAssignable<Encoder.Options>({ container: "json" });
expectAssignable<Encoder.VideoOptions>({ codec: "mock-rgba", bitrate: 1_000_000 });
expectAssignable<Encoder.AudioOptions>({ codec: "mock-f32", bitrate: 128_000 });
expectError<Encoder.Options>({ filename: "missing-container.json" });

declare const encoderService: Encoder.Encoder;
declare const encoderComposite: Composite.Composite<"video-error", VideoRuntime>;
const encoded = encoderService.encode(encoderComposite, { container: "json", filename: "out.json" });
expectAssignable<Encoder.EncodedFile<"video-error" | Encoder.EncoderError, VideoRuntime>>(encoded);
expectAssignable<Stream.Stream<Uint8Array, "file-error", FileContext>>(
  {} as Encoder.EncodedFile<"file-error", FileContext>["data"],
);
