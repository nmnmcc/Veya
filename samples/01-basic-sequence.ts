import { Effect, Stream } from "effect";
import { AudioTrack, Composite, Gap, Silence, VideoTrack } from "@veya/core";
import { Color } from "@veya/color";
import { runSample, sampleChannels, sampleFramerate, sampleSamplerate, sampleSize } from "./support";

export const program = Effect.gen(function* () {
  const blue = Color.make(Effect.succeed([34, 92, 180, 255] as const), Effect.succeed(4), {
    size: Effect.succeed(sampleSize),
  });
  const amber = Color.make(Effect.succeed([238, 181, 78, 255] as const), Effect.succeed(4), {
    size: Effect.succeed(sampleSize),
  });

  const composite = Composite.make({
    video: {
      framerate: Effect.succeed(sampleFramerate),
      size: Effect.succeed(sampleSize),
      tracks: [VideoTrack.make([blue, Gap.make(Effect.succeed(2)), amber])],
    },
    audio: {
      samplerate: Effect.succeed(sampleSamplerate),
      channels: Effect.succeed(sampleChannels),
      tracks: [AudioTrack.make([Silence.make(Effect.succeed(sampleSamplerate / 2))])],
    },
  });

  const videoFrames = yield* Stream.runCount(composite.video);
  const audioChunks = yield* Stream.runCount(composite.audio);

  return {
    sample: "basic-sequence",
    videoFrames,
    audioChunks,
  };
});

const summary = await runSample(program);
console.log(summary);
