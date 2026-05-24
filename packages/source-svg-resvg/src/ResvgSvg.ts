import { Buffer } from "node:buffer";
import { Effect, Layer, Stream } from "effect";
import type { Bitmap, Size as SizeType } from "@veya/core";
import { SvgProbe, SvgSource } from "@veya/source-svg";
import { Resvg } from "@resvg/resvg-js";
import type { ResvgRenderOptions } from "@resvg/resvg-js";

export namespace ResvgSvg {
  export interface Options {
    readonly render?: ResvgRenderOptions;
  }

  export const make = (options: Options = {}): SvgSource.Service & (typeof SvgProbe)["Service"] => ({
    decode: (source, decodeOptions) =>
      Effect.gen(function* () {
        const input = yield* loadSource(source, (reason) => new SvgSource.SvgSourceError({ reason }));
        const renderOptions = makeRenderOptions(options.render, decodeOptions);

        return yield* Effect.try({
          try: () => {
            const resvg = new Resvg(input, renderOptions);
            const rendered = resvg.render();
            const size: SizeType = [rendered.width, rendered.height];

            return pixelsToBitmap(rendered.pixels, size);
          },
          catch: (reason) => new SvgSource.SvgSourceError({ reason }),
        });
      }),
    probe: (source) =>
      Effect.gen(function* () {
        const input = yield* loadSource(source, (reason) => new SvgProbe.SvgProbeError({ reason }));

        return yield* Effect.try({
          try: () => {
            const resvg = new Resvg(input, options.render);
            const size: SizeType = [resvg.width, resvg.height];

            return { size };
          },
          catch: (reason) => new SvgProbe.SvgProbeError({ reason }),
        });
      }),
  });

  export const sourceLayer = (options: Options = {}) => Layer.succeed(SvgSource, make(options));

  export const probeLayer = (options: Options = {}) => Layer.succeed(SvgProbe, make(options));

  export const layer = (options: Options = {}) => Layer.mergeAll(sourceLayer(options), probeLayer(options));

  const makeRenderOptions = (
    defaults: ResvgRenderOptions | undefined,
    options: SvgSource.DecodeOptions,
  ): ResvgRenderOptions => ({
    ...defaults,
    ...(options.fitTo === undefined ? {} : { fitTo: options.fitTo }),
    ...(options.background === undefined ? {} : { background: options.background }),
  });

  const loadSource = <SourceE, SourceR, E>(
    source: SvgSource.MediaSource<SourceE, SourceR>,
    onError: (reason: unknown) => E,
  ): Effect.Effect<string | Buffer, SourceE | E, SourceR> => {
    if (typeof source === "string") return Effect.succeed(source);
    if (source instanceof Uint8Array) return Effect.succeed(Buffer.from(source));
    if (Stream.isStream(source)) return Effect.map(Stream.mkUint8Array(source), (bytes) => Buffer.from(bytes));

    return Effect.fail(onError(new Error("unsupported SVG source")));
  };

  const pixelsToBitmap = (pixels: Uint8Array, [width, height]: SizeType): Bitmap => {
    const expectedBytes = width * height * 4;
    if (pixels.length < expectedBytes) {
      throw new Error(`resvg returned ${pixels.length} RGBA bytes for a ${width}x${height} image`);
    }

    let offset = 0;

    return globalThis.Array.from({ length: height }, () =>
      globalThis.Array.from({ length: width }, () => {
        const pixel = [
          pixels[offset] ?? 0,
          pixels[offset + 1] ?? 0,
          pixels[offset + 2] ?? 0,
          pixels[offset + 3] ?? 0,
        ] as const;
        offset += 4;

        return pixel;
      }),
    );
  };
}
