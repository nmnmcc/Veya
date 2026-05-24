import { Effect, Stream } from "effect";
import { AudioTrack, Composite, Gap, Silence, VideoTrack } from "@veya/core";
import { Color } from "@veya/source-color";
import { runSample, sampleChannels, sampleFramerate, sampleSamplerate, sampleSize } from "./support";

export const program = Effect.gen(function* () {
  const blue = yield* Color.make([34, 92, 180, 255], 4, { size: sampleSize });
  const amber = yield* Color.make([238, 181, 78, 255], 4, { size: sampleSize });

  const composite = Composite.make({
    video: {
      framerate: sampleFramerate,
      size: sampleSize,
      tracks: [VideoTrack.make([blue, Gap.make(2), amber])],
    },
    audio: {
      samplerate: sampleSamplerate,
      channels: sampleChannels,
      tracks: [AudioTrack.make([Silence.make(sampleSamplerate / 2)])],
    },
  });

  const videoFrames = yield* Stream.runCount(composite.video.render);
  const audioChunks = yield* Stream.runCount(composite.audio.render);

  return {
    sample: "basic-sequence",
    videoFrames,
    audioChunks,
  };
});

const summary = await runSample(program);
console.log(summary);
