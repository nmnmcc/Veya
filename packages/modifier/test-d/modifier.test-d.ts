import { Effect } from "effect";
import { expectAssignable, expectError, expectType } from "tsd";
import type { AudioChunk, AudioClip, Bitmap, VideoClip } from "@veya/core";
import { AudioModifier, VideoModifier } from "@veya/modifier";

interface VideoModifierContext {
  readonly videoModifierContext: "video-modifier";
}

interface SecondVideoModifierContext {
  readonly secondVideoModifierContext: "second-video-modifier";
}

interface VideoOptionsContext {
  readonly videoOptionsContext: "video-options";
}

interface VideoClipContext {
  readonly videoClipContext: "video-clip";
}

interface VideoInitContext {
  readonly videoInitContext: "video-init";
}

interface VideoStateContext {
  readonly videoStateContext: "video-state";
}

interface AudioModifierContext {
  readonly audioModifierContext: "audio-modifier";
}

interface SecondAudioModifierContext {
  readonly secondAudioModifierContext: "second-audio-modifier";
}

interface AudioOptionsContext {
  readonly audioOptionsContext: "audio-options";
}

interface AudioClipContext {
  readonly audioClipContext: "audio-clip";
}

interface AudioInitContext {
  readonly audioInitContext: "audio-init";
}

interface AudioStateContext {
  readonly audioStateContext: "audio-state";
}

interface VideoState {
  readonly count: number;
}

interface AudioState {
  readonly samples: number;
}

declare const frame: Bitmap;
declare const chunk: AudioChunk;
declare const videoClip: VideoClip.VideoClip<"video-clip-error", VideoClipContext>;
declare const audioClip: AudioClip.AudioClip<"audio-clip-error", AudioClipContext>;
declare const videoOptions: Effect.Effect<VideoModifier.ContextOptions, "video-options-error", VideoOptionsContext>;
declare const audioOptions: Effect.Effect<AudioModifier.ContextOptions, "audio-options-error", AudioOptionsContext>;

expectAssignable<typeof VideoModifier.make>(VideoModifier.make);
expectAssignable<typeof VideoModifier.makeStateful>(VideoModifier.makeStateful);
expectAssignable<typeof VideoModifier.makeStatefulEffect>(VideoModifier.makeStatefulEffect);
expectAssignable<typeof VideoModifier.apply>(VideoModifier.apply);
expectAssignable<typeof VideoModifier.applyStateful>(VideoModifier.applyStateful);
expectAssignable<typeof VideoModifier.chain>(VideoModifier.chain);
expectAssignable<typeof AudioModifier.make>(AudioModifier.make);
expectAssignable<typeof AudioModifier.makeStateful>(AudioModifier.makeStateful);
expectAssignable<typeof AudioModifier.makeStatefulEffect>(AudioModifier.makeStatefulEffect);
expectAssignable<typeof AudioModifier.apply>(AudioModifier.apply);
expectAssignable<typeof AudioModifier.applyStateful>(AudioModifier.applyStateful);
expectAssignable<typeof AudioModifier.chain>(AudioModifier.chain);

expectAssignable<VideoModifier.FrameContext>({ index: 0, size: [320, 180], framerate: 24 });
expectError<VideoModifier.FrameContext>({ size: [320, 180] });
expectAssignable<VideoModifier.ContextOptions>({ size: [320, 180], framerate: 24 });
expectAssignable<VideoModifier.Options<"video-options-error", VideoOptionsContext>>({ context: videoOptions });

expectAssignable<AudioModifier.ChunkContext>({ index: 0, samplesBefore: 0, samplerate: 48000, channels: 2 });
expectError<AudioModifier.ChunkContext>({ index: 0, samplerate: 48000, channels: 2 });
expectAssignable<AudioModifier.ContextOptions>({ samplerate: 48000, channels: 2 });
expectAssignable<AudioModifier.Options<"audio-options-error", AudioOptionsContext>>({ context: audioOptions });

const passthroughVideoModifier = VideoModifier.make((input) => Effect.succeed(input));
expectAssignable<VideoModifier.VideoModifier>(passthroughVideoModifier);
expectError(VideoModifier.make(() => Effect.succeed("not-a-bitmap")));

declare const effectfulVideoApply: (
  input: Bitmap,
  context: VideoModifier.FrameContext,
) => Effect.Effect<Bitmap, "video-modifier-error", VideoModifierContext>;
const effectfulVideoModifier = VideoModifier.make(effectfulVideoApply);
expectAssignable<VideoModifier.VideoModifier<"video-modifier-error", VideoModifierContext>>(effectfulVideoModifier);

const appliedVideoModifier = VideoModifier.apply(effectfulVideoModifier, { context: videoOptions })(videoClip);
expectAssignable<
  VideoClip.VideoClip<
    "video-clip-error" | "video-modifier-error" | "video-options-error",
    VideoClipContext | VideoModifierContext | VideoOptionsContext
  >
>(appliedVideoModifier);
expectError(VideoModifier.apply(effectfulVideoModifier)(audioClip));

declare const secondVideoModifier: VideoModifier.VideoModifier<
  "second-video-modifier-error",
  SecondVideoModifierContext
>;
const chainedVideoModifier = VideoModifier.chain(effectfulVideoModifier, secondVideoModifier);
expectAssignable<
  VideoModifier.VideoModifier<
    "video-modifier-error" | "second-video-modifier-error",
    VideoModifierContext | SecondVideoModifierContext
  >
>(chainedVideoModifier);
expectAssignable<VideoModifier.VideoModifier>(VideoModifier.passthrough);

const pureStatefulVideoModifier = VideoModifier.makeStateful(
  (): VideoState => ({ count: 0 }),
  (state, input) => Effect.succeed([state, [input] as const] as const),
);
expectAssignable<VideoModifier.StatefulVideoModifier<VideoState>>(pureStatefulVideoModifier);

declare const videoInitialEffect: () => Effect.Effect<
  VideoState,
  "video-init-error" | "video-state-error",
  VideoInitContext | VideoStateContext
>;
declare const videoStateApply: (
  state: VideoState,
  input: Bitmap,
  context: VideoModifier.FrameContext,
) => Effect.Effect<
  readonly [state: VideoState, frames: readonly Bitmap[]],
  "video-init-error" | "video-state-error",
  VideoInitContext | VideoStateContext
>;
const effectfulStatefulVideoModifier = VideoModifier.makeStatefulEffect(videoInitialEffect, videoStateApply);
expectAssignable<
  VideoModifier.StatefulVideoModifier<
    VideoState,
    "video-init-error" | "video-state-error",
    VideoInitContext | VideoStateContext
  >
>(effectfulStatefulVideoModifier);

const appliedStatefulVideoModifier = VideoModifier.applyStateful(effectfulStatefulVideoModifier, {
  context: videoOptions,
})(videoClip);
expectAssignable<
  VideoClip.VideoClip<
    "video-clip-error" | "video-init-error" | "video-state-error" | "video-options-error",
    VideoClipContext | VideoInitContext | VideoStateContext | VideoOptionsContext
  >
>(appliedStatefulVideoModifier);

const passthroughAudioModifier = AudioModifier.make((input) => Effect.succeed(input));
expectAssignable<AudioModifier.AudioModifier>(passthroughAudioModifier);
expectError(AudioModifier.make(() => Effect.succeed("not-an-audio-chunk")));

declare const effectfulAudioApply: (
  input: AudioChunk,
  context: AudioModifier.ChunkContext,
) => Effect.Effect<AudioChunk, "audio-modifier-error", AudioModifierContext>;
const effectfulAudioModifier = AudioModifier.make(effectfulAudioApply);
expectAssignable<AudioModifier.AudioModifier<"audio-modifier-error", AudioModifierContext>>(effectfulAudioModifier);

const appliedAudioModifier = AudioModifier.apply(effectfulAudioModifier, { context: audioOptions })(audioClip);
expectAssignable<
  AudioClip.AudioClip<
    "audio-clip-error" | "audio-modifier-error" | "audio-options-error",
    AudioClipContext | AudioModifierContext | AudioOptionsContext
  >
>(appliedAudioModifier);
expectError(AudioModifier.apply(effectfulAudioModifier)(videoClip));

declare const secondAudioModifier: AudioModifier.AudioModifier<
  "second-audio-modifier-error",
  SecondAudioModifierContext
>;
const chainedAudioModifier = AudioModifier.chain(effectfulAudioModifier, secondAudioModifier);
expectAssignable<
  AudioModifier.AudioModifier<
    "audio-modifier-error" | "second-audio-modifier-error",
    AudioModifierContext | SecondAudioModifierContext
  >
>(chainedAudioModifier);
expectAssignable<AudioModifier.AudioModifier>(AudioModifier.passthrough);
expectType<number>(AudioModifier.getSampleCount(chunk));

const pureStatefulAudioModifier = AudioModifier.makeStateful(
  (): AudioState => ({ samples: 0 }),
  (state, input) => Effect.succeed([state, [input] as const] as const),
);
expectAssignable<AudioModifier.StatefulAudioModifier<AudioState>>(pureStatefulAudioModifier);

declare const audioInitialEffect: () => Effect.Effect<
  AudioState,
  "audio-init-error" | "audio-state-error",
  AudioInitContext | AudioStateContext
>;
declare const audioStateApply: (
  state: AudioState,
  input: AudioChunk,
  context: AudioModifier.ChunkContext,
) => Effect.Effect<
  readonly [state: AudioState, chunks: readonly AudioChunk[]],
  "audio-init-error" | "audio-state-error",
  AudioInitContext | AudioStateContext
>;
const effectfulStatefulAudioModifier = AudioModifier.makeStatefulEffect(audioInitialEffect, audioStateApply);
expectAssignable<
  AudioModifier.StatefulAudioModifier<
    AudioState,
    "audio-init-error" | "audio-state-error",
    AudioInitContext | AudioStateContext
  >
>(effectfulStatefulAudioModifier);

const appliedStatefulAudioModifier = AudioModifier.applyStateful(effectfulStatefulAudioModifier, {
  context: audioOptions,
})(audioClip);
expectAssignable<
  AudioClip.AudioClip<
    "audio-clip-error" | "audio-init-error" | "audio-state-error" | "audio-options-error",
    AudioClipContext | AudioInitContext | AudioStateContext | AudioOptionsContext
  >
>(appliedStatefulAudioModifier);

expectAssignable<Effect.Effect<Bitmap, never, never>>(VideoModifier.passthrough.apply(frame, { index: 0 }));
expectAssignable<Effect.Effect<AudioChunk, never, never>>(
  AudioModifier.passthrough.apply(chunk, { index: 0, samplesBefore: 0 }),
);
