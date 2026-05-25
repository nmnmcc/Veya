import { Duration, Effect, Stream } from "effect";
import { expectAssignable, expectError, expectNotAssignable, expectType } from "tsd";
import type { AudioChunk, AudioClip } from "@veya/core";
import { Audio, AudioProbe, AudioSource } from "@veya/source-audio";

type EffectSuccess<T> = T extends Effect.Effect<infer A, unknown, unknown> ? A : never;

interface StreamContext {
  readonly streamContext: "stream";
}

declare const bytes: Uint8Array;
declare const byteStream: Stream.Stream<Uint8Array, "stream-error", StreamContext>;

expectAssignable<typeof AudioProbe>(AudioProbe);
expectAssignable<typeof AudioSource>(AudioSource);
expectAssignable<typeof Audio.make>(Audio.make);

expectAssignable<AudioSource.MediaSource>(bytes);
expectAssignable<AudioSource.MediaSource<"stream-error", StreamContext>>(byteStream);
expectNotAssignable<AudioSource.MediaSource>("audio.wav");

expectAssignable<AudioSource.DecodeOptions>({
  samplerate: 48000,
  channels: 2,
  offset: 1024,
  samples: 2048,
  speed: 0.75,
});
expectError<AudioSource.DecodeOptions>({ channels: "stereo" });

declare const audioSourceService: AudioSource.Service;
expectAssignable<Stream.Stream<AudioChunk, "stream-error" | AudioSource.AudioSourceError, StreamContext>>(
  audioSourceService.decode(byteStream, { samples: 1024 }),
);

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
