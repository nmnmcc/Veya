import { NodeWorkerRunner } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import * as RpcServer from "effect/unstable/rpc/RpcServer";

import { GradientRpcs, type Pixel, type Row } from "./schemas";

const WIDTH = 1920;
const TOTAL_FRAMES = 30 * 60;
const HUE_SPREAD = 60;
const SATURATION = 0.45;
const LIGHTNESS = 0.55;

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (hue < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (hue < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (hue < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function generateRow(frameIndex: number): Row {
  const progress = frameIndex / TOTAL_FRAMES;
  const baseHue = progress * 360;
  const row: Pixel[] = new Array(WIDTH);

  for (let x = 0; x < WIDTH; x++) {
    const t = x / (WIDTH - 1);
    const hue = baseHue + (t - 0.5) * HUE_SPREAD;
    const [r, g, b] = hslToRgb(hue, SATURATION, LIGHTNESS);
    row[x] = [r, g, b, 1];
  }

  return row;
}

const GradientLive = GradientRpcs.toLayer(
  Effect.succeed(
    GradientRpcs.of({
      GenerateRow: ({ frameIndex }: { frameIndex: number }) => Effect.sync(() => generateRow(frameIndex)),
    }),
  ),
);

const MainLive = RpcServer.layer(GradientRpcs).pipe(
  Layer.provide(GradientLive),
  Layer.provide(RpcServer.layerProtocolWorkerRunner),
  Layer.provide(NodeWorkerRunner.layer),
);

Effect.runFork(Layer.launch(MainLive));
