import { availableParallelism } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker as WorkerThread } from "node:worker_threads";

import { NodeServices, NodeWorker } from "@effect/platform-node";
import { registerMediabunnyServer } from "@mediabunny/server";
import { Console, Context, Effect, FileSystem, Layer, Stream } from "effect";
import * as RpcClient from "effect/unstable/rpc/RpcClient";
import type { RpcClientError } from "effect/unstable/rpc/RpcClientError";
import type * as RpcGroup from "effect/unstable/rpc/RpcGroup";
import { QUALITY_HIGH } from "mediabunny";

import { VideoClip, VideoContext, VideoTick } from "@veya/core";
import { MediabunnyVideoEncoder } from "@veya/mediabunny";

import { GradientRpcs } from "./schemas";

registerMediabunnyServer();

const outputPath = fileURLToPath(new URL("../dist/gradient.mp4", import.meta.url));

const FRAMERATE = 30;
const DURATION = 60;
const WIDTH = 1920;
const HEIGHT = 1080;

const TOTAL_FRAMES = FRAMERATE * DURATION;

const videoContext = VideoContext.of({
  framerate: FRAMERATE,
  size: [WIDTH, HEIGHT],
  colorSpace: "srgb",
});

class GradientClient extends Context.Service<
  GradientClient,
  RpcClient.RpcClient<RpcGroup.Rpcs<typeof GradientRpcs>, RpcClientError>
>()("GradientClient") {
  static readonly layer = Layer.effect(GradientClient)(RpcClient.make(GradientRpcs));
}

const workerLayer = GradientClient.layer.pipe(
  Layer.provide(RpcClient.layerProtocolWorker({ size: navigator.hardwareConcurrency, concurrency: 1 })),
  Layer.provide(NodeWorker.layer(() => new WorkerThread(new URL("./worker.ts", import.meta.url)))),
);

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const client = yield* GradientClient;

  const clip = yield* VideoClip.make((_stream: VideoTick.Frames) =>
    _stream.pipe(
      Stream.take(TOTAL_FRAMES),
      Stream.mapEffect(
        (frameIndex) =>
          client
            .GenerateRow({ frameIndex })
            .pipe(Effect.map((row): VideoClip.Bitmap => Array.from({ length: HEIGHT }, () => row))),
        { concurrency: navigator.hardwareConcurrency },
      ),
    ),
  );

  const encodable = clip(VideoTick.frames());

  const result = yield* MediabunnyVideoEncoder.encode(encodable, {
    encoding: {
      alpha: "discard",
      bitrate: QUALITY_HIGH,
      codec: "vp9",
      hardwareAcceleration: "prefer-software",
      keyFrameInterval: 2,
    },
  });

  yield* fs.makeDirectory(dirname(outputPath), { recursive: true });
  yield* fs.writeFile(outputPath, result.buffer);
  yield* Console.log(`Wrote ${outputPath}`);
}).pipe(Effect.provide(workerLayer));

Effect.runPromise(
  program.pipe(Effect.provideService(VideoContext, videoContext), Effect.provide(NodeServices.layer)),
).catch(console.error);
