import { Duration, Effect, Stream, pipe } from "effect";
import { Video, VideoFrame, VideoMetadata } from "@veya/video";
import { runSample, sampleMediaBytes, sampleSize } from "./support";

export const program = Effect.gen(function* () {
  const offsetEffect = VideoFrame.fromDuration(Duration.millis(500), "floor");
  const durationEffect = VideoFrame.fromDuration(Duration.seconds(1), "ceil");

  const clip = Video.make(sampleMediaBytes, {
    size: Effect.succeed(sampleSize),
    framerate: Effect.succeed(24),
    offset: offsetEffect,
    duration: durationEffect,
    playback: Effect.succeed("freeze" as const),
    speed: Effect.succeed(1.25),
  });
  const frames = yield* Stream.runCollect(clip);
  const offset = yield* pipe(offsetEffect, Effect.provideService(VideoMetadata, { framerate: 24 }));
  const oneSecond = yield* pipe(durationEffect, Effect.provideService(VideoMetadata, { framerate: 24 }));

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
