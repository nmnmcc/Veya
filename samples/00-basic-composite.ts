import { Effect, Stream } from "effect";
import { AudioTrack, Composite, Silence, VideoTrack } from "@veya/core";
import { Color } from "@veya/color";
import { runSample, sampleChannels, sampleFramerate, sampleSamplerate, sampleSize } from "./support";

export const program = Effect.gen(function* () {
  const slate = Color.make(Effect.succeed([24, 32, 44, 255] as const), Effect.succeed(6), {
    size: Effect.succeed(sampleSize),
  });

  const composite = Composite.make({
    video: {
      framerate: Effect.succeed(sampleFramerate),
      size: Effect.succeed(sampleSize),
      tracks: [VideoTrack.make([slate])],
    },
    audio: {
      samplerate: Effect.succeed(sampleSamplerate),
      channels: Effect.succeed(sampleChannels),
      tracks: [AudioTrack.make([Silence.make(Effect.succeed(sampleSamplerate / 4))])],
    },
  });

  return {
    sample: "basic-composite",
    videoFrames: yield* Stream.runCount(composite.video),
    audioChunks: yield* Stream.runCount(composite.audio),
  };
});

const summary = await runSample(program);
console.log(summary);
