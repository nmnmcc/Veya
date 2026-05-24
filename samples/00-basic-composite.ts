import { Effect, Stream } from "effect";
import { AudioTrack, Composite, Silence, VideoTrack } from "@veya/core";
import { Color } from "@veya/source-color";
import { runSample, sampleChannels, sampleFramerate, sampleSamplerate, sampleSize } from "./support";

export const program = Effect.gen(function* () {
  const slate = yield* Color.make([24, 32, 44, 255], 6, { size: sampleSize });

  const composite = Composite.make({
    video: {
      framerate: sampleFramerate,
      size: sampleSize,
      tracks: [VideoTrack.make([slate])],
    },
    audio: {
      samplerate: sampleSamplerate,
      channels: sampleChannels,
      tracks: [AudioTrack.make([Silence.make(sampleSamplerate / 4)])],
    },
  });

  return {
    sample: "basic-composite",
    videoFrames: yield* Stream.runCount(composite.video.render),
    audioChunks: yield* Stream.runCount(composite.audio.render),
  };
});

const summary = await runSample(program);
console.log(summary);
