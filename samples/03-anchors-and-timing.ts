import { Effect, Stream } from "effect";
import { Video, VideoFrame } from "@veya/source-video";
import { runSample, sampleMediaBytes, sampleSize } from "./support";

export const program = Effect.gen(function* () {
  const offset = yield* VideoFrame.resolveOffset(VideoFrame.millis(500), { framerate: 24 });
  const oneSecond = yield* VideoFrame.resolveDuration(VideoFrame.seconds(1), { framerate: 24 });

  const clip = yield* Video.make(sampleMediaBytes, {
    size: sampleSize,
    framerate: 24,
    offset,
    duration: 6,
    playback: "freeze",
    speed: 1.25,
  });
  const frames = yield* Stream.runCollect(clip.render);

  return {
    sample: "anchors-and-timing",
    offset,
    oneSecond,
    renderedFrames: frames.length,
    firstPixel: frames[0]?.[0]?.[0] ?? null,
  };
});

const summary = await runSample(program);
console.log(summary);
