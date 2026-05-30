import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { NodeServices } from "@effect/platform-node";
import { registerMediabunnyServer } from "@mediabunny/server";
import { Array, Console, Effect, FileSystem, pipe, Stream } from "effect";
import { QUALITY_HIGH } from "mediabunny";

import { VideoClip, VideoContext, VideoTick, VideoTrack } from "@veya/core";
import { MediabunnyVideoEncoder } from "@veya/mediabunny";

import { digits } from "./digits";

registerMediabunnyServer();

const outputPath = fileURLToPath(new URL("../dist/countdown.mp4", import.meta.url));
const videoContext = VideoContext.of({
  framerate: 1,
  size: [3, 7],
});

const track = VideoTrack.make(
  pipe(
    Array.reverse(digits),
    Array.map((digit) =>
      VideoClip.make((stream: VideoTick.Frames) =>
        Stream.unwrap(
          Effect.gen(function* () {
            const { framerate } = yield* VideoContext;

            return stream.pipe(
              Stream.take(framerate),
              Stream.map(() => digit),
            );
          }),
        ),
      ),
    ),
  ),
);

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;

  const encodable = yield* VideoClip.toEncodable(VideoTick.frames(), track).pipe(
    Effect.provideService(VideoContext, videoContext),
  );
  const result = yield* MediabunnyVideoEncoder.encode(encodable, {
    encoding: {
      alpha: "keep",
      bitrate: QUALITY_HIGH,
      codec: "vp9",
      hardwareAcceleration: "prefer-software",
    },
  });

  yield* fs.makeDirectory(dirname(outputPath), { recursive: true });
  yield* fs.writeFile(outputPath, result.buffer);
  yield* Console.log(`Wrote ${outputPath}`);
});

Effect.runPromise(program.pipe(Effect.provide(NodeServices.layer))).catch(console.error);
